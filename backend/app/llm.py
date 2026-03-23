import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
from threading import Thread
import json
import re

class LLM:
    def __init__(self, model_id="meta-llama/Llama-2-7b-chat-hf"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        # Updated from torch_dtype=torch.float16 to dtype=torch.float16 as per contract
        self.model = AutoModelForCausalLM.from_pretrained(
            model_id,
            device_map="auto",
            dtype=torch.float16
        )

    def generate(self, prompt, max_new_tokens=512, temperature=0.7):
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)
        
        generate_kwargs = dict(
            **inputs,
            streamer=streamer,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
        )
        
        thread = Thread(target=self.model.generate, kwargs=generate_kwargs)
        thread.start()
        
        for new_text in streamer:
            # JSON fence cleanup moved into llm.py generate() method as per contract
            cleaned_text = self._cleanup_json_fences(new_text)
            yield cleaned_text

    def _cleanup_json_fences(self, text):
        # Remove markdown JSON code blocks if they are being streamed
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        return text

llm = LLM()
