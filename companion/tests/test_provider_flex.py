"""
Testes do payload do provedor compativel com OpenAI.

Regra do dono (08/11/2026): sabiazinho-4 sempre no tier Flex (50% mais
barato, sujeito a fila). O campo `service_tier` so pode aparecer nesse
caso — DeepSeek e outros modelos nao o conhecem e receberiam erro.
"""

from __future__ import annotations

import unittest

from ai.openai_compat_provider import montar_payload

MENSAGENS = [
    {"role": "system", "content": "voce e o Seu Nono"},
    {"role": "user", "content": "quanto custou a obra?"},
]


class TestPayloadFlex(unittest.TestCase):
    def test_sabiazinho_recebe_service_tier_flex(self):
        payload = montar_payload("sabiazinho-4", MENSAGENS)
        self.assertEqual(payload["service_tier"], "flex")
        self.assertEqual(payload["model"], "sabiazinho-4")
        self.assertEqual(payload["messages"], MENSAGENS)
        self.assertTrue(payload["stream"])
        self.assertEqual(payload["max_tokens"], 1024)

    def test_qualquer_sabiazinho_recebe_flex(self):
        payload = montar_payload("sabiazinho-4.1", MENSAGENS)
        self.assertEqual(payload["service_tier"], "flex")

    def test_deepseek_nao_recebe_service_tier(self):
        payload = montar_payload("deepseek-chat", MENSAGENS)
        self.assertNotIn("service_tier", payload)

    def test_sabia_comum_nao_recebe_service_tier(self):
        payload = montar_payload("sabia-4", MENSAGENS)
        self.assertNotIn("service_tier", payload)

    def test_montar_payload_nao_muta_as_mensagens(self):
        original = [dict(m) for m in MENSAGENS]
        montar_payload("sabiazinho-4", MENSAGENS)
        self.assertEqual(MENSAGENS, original)


if __name__ == "__main__":
    unittest.main()
