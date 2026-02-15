import discord
from discord.ext import commands
from typing import Optional, Union
from .constants import Colors, Emojis

class EmbedUtils:
    @staticmethod
    def success(title: str, description: str) -> discord.Embed:
        return discord.Embed(
            title=f"{Emojis.SUCCESS} {title}",
            description=description,
            color=Colors.SUCCESS
        )

    @staticmethod
    def error(title: str, description: str) -> discord.Embed:
        return discord.Embed(
            title=f"{Emojis.ERROR} {title}",
            description=description,
            color=Colors.ERROR
        )

    @staticmethod
    def warning(title: str, description: str) -> discord.Embed:
        return discord.Embed(
            title=f"{Emojis.WARNING} {title}",
            description=description,
            color=Colors.WARNING
        )
        
    @staticmethod
    def info(title: str, description: str) -> discord.Embed:
        return discord.Embed(
            title=f"{Emojis.INFO} {title}",
            description=description,
            color=Colors.INFO
        )
