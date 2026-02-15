from discord.ext import commands
from ..bot import RobloxKeysBot
from ..utils.logger import logger

class BaseCog(commands.Cog):
    def __init__(self, bot: RobloxKeysBot):
        self.bot = bot

    def log_command_usage(self, ctx: commands.Context, command_name: str):
        logger.info(f"Command '{command_name}' invoked by {ctx.author} ({ctx.author.id}) in {ctx.guild}")
