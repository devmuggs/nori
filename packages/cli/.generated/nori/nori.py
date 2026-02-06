from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class LanguageCode(StrEnum):
    ENGLISH_BRITISH = "en-GB"
    JAPANESE = "ja-JP"


@dataclass(frozen=True)
class NoriI18nCollection:
    english_british: str = ""
    japanese: str = ""

    def get(self, lang: LanguageCode) -> str:
        return getattr(self, lang.name.lower())


def _col(**kwargs: str) -> NoriI18nCollection:
    return NoriI18nCollection(**kwargs)

class root:
    """Collection: root"""

    @staticmethod
    def lets_get_started(*, topic: str) -> NoriI18nCollection:
      """
    en-GB: Displayed on first step of onboarding wizard.
    ja-JP: オンボーディングウィザードの最初のステップに表示されます。
      """
      return _col(
      english_british=f"Let's get started with {topic}.",
      japanese=f"さあ、{topic}を始めましょう！",
      )

class client:
    """Collection: client"""

    @staticmethod
    def greeting() -> NoriI18nCollection:
      """
    en-GB: A friendly greeting message.
    ja-JP: 親しみやすい挨拶メッセージ。
      """
      return _col(
      english_british="Hello!",
      japanese="こんにちは！",
      )

    @staticmethod
    def farewell() -> NoriI18nCollection:
      """
    en-GB: A friendly farewell message.
    ja-JP: 親しみやすい別れのメッセージ。
      """
      return _col(
      english_british="Goodbye!",
      japanese="さようなら！",
      )
