import os
import tempfile
import shutil
from dotenv import load_dotenv
import flask
from flask import request
from flask import jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import whisper
from transformers import T5Tokenizer, T5ForConditionalGeneration

# SECURITY FIX: Load environment variables
load_dotenv()

app = flask.Flask(__name__)

# SECURITY FIX: Configure CORS with specific allowed origins from environment
allowed_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:4200').split(',')
CORS(app, origins=allowed_origins, supports_credentials=True)

# SECURITY FIX: Add rate limiting to prevent abuse
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[
        f"{os.getenv('RATE_LIMIT_MAX_REQUESTS', '60')} per {int(os.getenv('RATE_LIMIT_WINDOW_MS', '60000')) // 1000} seconds"
    ],
    storage_uri="memory://"
)

app.config['PROFILE'] = True

whisper_model = None
tokenizer = None
text_model = None
device = None  # Will be set during model loading

def get_device():
    """Get the device for tensor operations (cuda or cpu)"""
    global device
    if device is None:
        device = 'cuda' if os.getenv('USE_CUDA', 'false').lower() == 'true' else 'cpu'
    return device

def load_model():
    """Load AI models with configuration from environment variables"""
    global whisper_model
    global tokenizer
    global text_model
    global device

    # SECURITY FIX: Load model configuration from environment
    whisper_model_size = os.getenv('WHISPER_MODEL_SIZE', 'large')
    flan_model_name = os.getenv('FLAN_MODEL_NAME', 'google/flan-t5-xl')

    # Auto-detect device (cuda if available, otherwise cpu)
    device = get_device()

    print(f"[Whisper Server] Loading Whisper model: {whisper_model_size} (device: {device})")
    whisper_model = whisper.load_model(whisper_model_size, device)

    print(f"[Whisper Server] Loading Flan-T5 model: {flan_model_name}")
    tokenizer = T5Tokenizer.from_pretrained(flan_model_name)
    text_model = T5ForConditionalGeneration.from_pretrained(flan_model_name, device_map="auto")


@app.route('/transcribe', methods=['POST'])
@limiter.limit("30 per minute")  # Additional rate limit for this expensive endpoint
def transcribe():
    """
    Transcribe audio file to text using Whisper model
    SECURITY FIX: Proper temp file cleanup to prevent disk space leak
    """
    temp_dir = None
    try:
        # Create temporary directory for audio file
        temp_dir = tempfile.mkdtemp()
        save_path = os.path.join(temp_dir, 'temp.wav')

        # Save uploaded audio file
        wav_file = request.files['audio_data']
        wav_file.save(save_path)

        # Transcribe audio
        result = whisper_model.transcribe(save_path, language='english')
        transcription_text = result['text']

        print(f'[Whisper Server] Transcription: {transcription_text}')
        return transcription_text

    except Exception as e:
        print(f'[Whisper Server] Error during transcription: {str(e)}')
        return jsonify({'error': str(e)}), 500

    finally:
        # SECURITY FIX: Always cleanup temp directory, even if error occurs
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                print(f'[Whisper Server] Cleaned up temp directory: {temp_dir}')
            except Exception as cleanup_error:
                print(f'[Whisper Server] Warning: Failed to cleanup temp directory: {cleanup_error}')


# ==============================================================================
# HEALTH CHECK ENDPOINTS
# ==============================================================================
# These endpoints allow monitoring systems (Kubernetes, Docker, etc.) to verify
# that the server is running and ready to handle requests

@app.route('/health', methods=['GET'])
@limiter.exempt  # Don't rate limit health checks
def health():
    """
    Basic liveness check - confirms server is running
    Returns 200 OK if server is alive
    """
    import psutil
    import datetime

    return jsonify({
        'status': 'ok',
        'service': 'whisper-server',
        'timestamp': datetime.datetime.now().isoformat(),
        'uptime': int(psutil.Process(os.getpid()).create_time()),
        'environment': os.getenv('FLASK_ENV', 'development'),
        'python_version': os.sys.version,
    }), 200


@app.route('/health/ready', methods=['GET'])
@limiter.exempt  # Don't rate limit health checks
def health_ready():
    """
    Readiness check - confirms server is ready to handle requests
    Checks if AI models are loaded and system resources are adequate
    Returns 200 OK if ready, 503 Service Unavailable if not ready
    """
    import psutil
    import datetime

    checks = {
        'status': 'ok',
        'service': 'whisper-server',
        'timestamp': datetime.datetime.now().isoformat(),
        'checks': {
            'server': 'ok',
            'whisper_model': 'unknown',
            'text_model': 'unknown',
            'tokenizer': 'unknown',
            'memory': 'unknown',
        }
    }

    all_ready = True

    # Check if Whisper model is loaded
    if whisper_model is not None:
        checks['checks']['whisper_model'] = 'ok'
    else:
        checks['checks']['whisper_model'] = 'not_loaded'
        all_ready = False

    # Check if text generation model is loaded
    if text_model is not None:
        checks['checks']['text_model'] = 'ok'
    else:
        checks['checks']['text_model'] = 'not_loaded'
        all_ready = False

    # Check if tokenizer is loaded
    if tokenizer is not None:
        checks['checks']['tokenizer'] = 'ok'
    else:
        checks['checks']['tokenizer'] = 'not_loaded'
        all_ready = False

    # Check memory usage
    try:
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        checks['checks']['memory'] = f'{memory_percent}%'

        # Warn if memory usage is very high (>90%)
        if memory_percent > 90:
            checks['checks']['memory_status'] = 'critical'
            checks['status'] = 'degraded'
        elif memory_percent > 80:
            checks['checks']['memory_status'] = 'warning'
        else:
            checks['checks']['memory_status'] = 'ok'

    except Exception as e:
        checks['checks']['memory'] = 'error'
        checks['checks']['memory_error'] = str(e)

    # Set overall status
    if not all_ready:
        checks['status'] = 'not_ready'
        return jsonify(checks), 503
    elif checks['status'] == 'degraded':
        return jsonify(checks), 503
    else:
        return jsonify(checks), 200


# ==============================================================================
# AI MODEL ENDPOINTS
# ==============================================================================

STATE_TEMPERATURE = 1.0
PERSON_INTENT_TEMPERATURE = 1.0
PERSON_INFERENCE_TEMPERATURE = 1.0

person_speech = [
    "person: Hey, have you heard about the latest advancements in space technology?",
    "person: I'm really interested in the concept of colonizing Mars.",
    "person: Did you know that SpaceX has plans to send humans to Mars as soon as 2024?"
]
question_intent = [
    'Q: What is the intent of the person speaking?',
]
question_inference = [
    'Q: what kind of person is the person speaking?'
]
example_1_inferences = person_speech + question_inference + \
    ["Answer: This person is: a scientist"]
example_1_intent = person_speech + question_intent + \
    ["Answer: The intent of the person is: to start conversation about space exploration and colonizing Mars"]

def build_state(world_state, conversation):
    prompt = ['Infer some more state about the preceding speaker, do it in JSON. Add to the current state already inferred']
    question = ['Q: What other qualities about the conversation can we infer?']
    answer_line = ['So we already know that' + world_state + ' An additional thing we can infer from the conversation is that']
    input_text = '\n'.join(conversation + prompt +
                            question + answer_line)
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to(get_device())
    outputs = text_model.generate(input_ids, max_length=2000, temperature=STATE_TEMPERATURE)
    world_state = tokenizer.decode(outputs[0]).split('<pad>')[
        1].split('</s')[0]
    return world_state

def get_persons_intent(question_speech):
    prompt = example_1_intent + ['\nEXAMPLE 2:'] + question_speech + \
        question_intent + ['Answer: The intent of this person is:']
    input_text = '\n'.join(prompt)
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to(get_device())
    outputs = text_model.generate(input_ids, max_length=2000, temperature=PERSON_INTENT_TEMPERATURE)
    intent_of_person = tokenizer.decode(outputs[0]).split('<pad>')[
        1].split('</s')[0]
    return intent_of_person

def get_inference_about_person(question_speech):
    prompt = example_1_inferences + \
        ['\nEXAMPLE 2:'] + question_speech + \
        question_inference + ['Answer: This person is:']
    input_text = '\n'.join(prompt)
    input_ids = tokenizer(input_text, return_tensors="pt",
                          padding='do_not_pad').input_ids.to(get_device())
    outputs = text_model.generate(input_ids, max_length=2000, temperature=PERSON_INFERENCE_TEMPERATURE)
    inference_about_person = tokenizer.decode(
        outputs[0]).split('<pad>')[1].split('</s')[0]
    return inference_about_person


def build_state(world_state, conversation):
    prompt = ['Infer some more state about the preceding speaker. "Person" is speaking to a bot. Youre the bot.']
    question = ['Q: What other qualities about the person we can infer?']
    answer_line = ['So we already know that' + world_state + ' An additional thing we can infer from the conversation is that']
    input_text = '\n'.join(conversation + prompt +
                            question + answer_line)
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to(get_device())
    # time the inference
    outputs = text_model.generate(input_ids, max_length=2000, temperature=STATE_TEMPERATURE)
    world_state = tokenizer.decode(outputs[0]).split('<pad>')[
        1].split('</s')[0]
    return world_state


def get_thoughts(conversation):
    prompt = ['This is an entry from psychology book, called, "On ADHD and random thought generation":'] + ['One of a common symptom of ADHD is random thoughts related to the topic at hand. For example, with the following conversation:']
    answer_line = ['The listener will have many different thoughts in quick succession relating to the topic. Write different thoughts that the listener might have, each thought vastly different. Answer:']
    input_text = '\n'.join(prompt + conversation + answer_line)
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to(get_device())
    outputs = text_model.generate(input_ids, max_length=50, temperature=1)
    thought = tokenizer.decode(outputs[0]).split('<pad>')[
    1].split('</s')[0]
    return thought

def get_thoughts_2(conversation):
    prompt = ["Person's speech"]
    answer_line = ['Random thoughts about the speech, that you, a sentient robot, could have:']
    input_text = '\n'.join(prompt + conversation + answer_line)
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to(get_device())
    outputs = text_model.generate(input_ids, max_length=50, temperature=1)
    thought = tokenizer.decode(outputs[0]).split('<pad>')[
    1].split('</s')[0]
    return thought


def get_persons_intent(question_speech):
    prompt = example_1_intent + ['\nEXAMPLE 2:'] + question_speech + \
        question_intent + ['Answer: The intent of this person is:']
    input_text = '\n'.join(prompt)
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids.to(get_device())
    # time the inference
    outputs = text_model.generate(input_ids, max_length=2000, temperature=PERSON_INTENT_TEMPERATURE)
    intent_of_person = tokenizer.decode(outputs[0]).split('<pad>')[
        1].split('</s')[0]

    return intent_of_person


def get_inference_about_person(question_speech):
    prompt = example_1_inferences + \
        ['\nEXAMPLE 2:'] + question_speech + \
        question_inference + ['Answer: This person is:']
    input_text = '\n'.join(prompt)
    input_ids = tokenizer(input_text, return_tensors="pt",
                          padding='do_not_pad').input_ids.to(get_device())
    outputs = text_model.generate(input_ids, max_length=2000, temperature=PERSON_INFERENCE_TEMPERATURE)

    inference_about_person = tokenizer.decode(
        outputs[0]).split('<pad>')[1].split('</s')[0]
    return inference_about_person


def generate_response(thoughts, conversation):
    pre_convo = ["I'm a helpful, happy, sentient robot. This is the conversation of a human that they're having with me"]
    pre_thought = ["These are my thoughts about the preceding lines. I should use thoughts, when I generate a reasonable response."]
    answer = ["My response to the person should be:"]

    input_text = '\n'.join(pre_convo + conversation + pre_thought + thoughts + answer)

    input_ids = tokenizer(input_text, return_tensors="pt",
                          padding='do_not_pad').input_ids.to(get_device())
    outputs = text_model.generate(input_ids, max_length=2000, temperature=PERSON_INFERENCE_TEMPERATURE)

    response = tokenizer.decode(
        outputs[0]).split('<pad>')[1].split('</s')[0]
    return response 


@app.route('/generate_thots', methods=['POST'])
def generate_thots():
    question_speech = request.get_json()['conversation_speech']
    person_intent = get_persons_intent(question_speech)
    person_is = get_inference_about_person(question_speech)
    world_state = 'this person is a ' + person_is + ' and their intent is ' + person_intent + '.'
    new_state = build_state(world_state, question_speech)
    intent_pretty = "this person's intent is " + person_intent.lower().strip()
    person_is_pretty ='this person is a ' + person_is.lower().strip()
    extra_state_pretty = new_state.lower().strip()
    thoughts = get_thoughts_2(question_speech).lower().strip()
    response = generate_response(question_speech, [intent_pretty, person_is_pretty, extra_state_pretty, thoughts])
    response_data = {
        'intent': intent_pretty,
        'person_is': person_is_pretty,
        'extra_state': extra_state_pretty,
        'thoughts': thoughts,
        'response': response,
    }
    return jsonify(response_data)

if __name__ == "__main__":
    # SECURITY FIX: Load server configuration from environment
    host = os.getenv('WHISPER_SERVER_HOST', 'localhost')
    port = int(os.getenv('WHISPER_SERVER_PORT', '5000'))
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    flask_env = os.getenv('FLASK_ENV', 'development')

    print("=" * 70)
    print("[Whisper Server] Starting Scribepod Whisper AI Server")
    print("=" * 70)
    print(f"[Whisper Server] Environment: {flask_env}")
    print(f"[Whisper Server] Host: {host}")
    print(f"[Whisper Server] Port: {port}")
    print(f"[Whisper Server] Debug: {debug}")
    print(f"[Whisper Server] CORS allowed origins: {allowed_origins}")
    print(f"[Whisper Server] Rate limit: {os.getenv('RATE_LIMIT_MAX_REQUESTS', '60')} requests per minute")
    print("=" * 70)

    # Load AI models
    print("[Whisper Server] Loading AI models (this may take a few minutes)...")
    load_model()
    print("[Whisper Server] Models loaded successfully!")
    print("=" * 70)

    # Start Flask server
    app.run(host=host, port=port, debug=debug)


