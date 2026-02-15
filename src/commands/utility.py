import discord
from discord import app_commands
from discord.ext import commands
import time
import platform
from ..utils.base_cog import BaseCog
from ..utils.embeds import EmbedUtils
from ..utils.constants import Emojis, Colors
from ..utils.components_v2 import create_container

class Utility(BaseCog):
    def __init__(self, bot):
        super().__init__(bot)

    @app_commands.command(name="ping", description="Check bot latency")
    async def ping(self, interaction: discord.Interaction):
        start = time.perf_counter()
        await interaction.response.defer()
        end = time.perf_counter()
        
        latency = round(self.bot.latency * 1000)
        api_latency = round((end - start) * 1000)
        
        embed = create_container(title=f"{Emojis.STORE} Pong!", color=Colors.PRIMARY).build()
        embed.add_field(name=f"{Emojis.BOOST} API Latency", value=f"`{api_latency}ms`", inline=True)
        embed.add_field(name=f"{Emojis.AI} Websocket", value=f"`{latency}ms`", inline=True)
        
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="status", description="Advanced system status")
    async def status(self, interaction: discord.Interaction):
        await interaction.response.defer()
        
        embed = create_container(title="System Status", color=Colors.INFO).build()
        
        # System Info
        embed.add_field(name="OS", value=platform.system(), inline=True)
        embed.add_field(name="Python", value=platform.python_version(), inline=True)
        embed.add_field(name="Discord.py", value=discord.__version__, inline=True)
        
        # Bot Stats
        embed.add_field(name="Guilds", value=str(len(self.bot.guilds)), inline=True)
        embed.add_field(name="Users", value=str(sum(g.member_count for g in self.bot.guilds)), inline=True)
        
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="faq", description="Frequently Asked Questions")
    async def faq(self, interaction: discord.Interaction):
        # Ultra Advanced: Select Menu for topics
        topics = {
            "payment": "We accept various crypto and cards via our store payment gateway.",
            "delivery": "All products are delivered instantly via email.",
            "support": "Open a ticket in #support for assistance."
        }
        
        options = [
            discord.SelectOption(label=k.capitalize(), value=k, description=v[:50]+"...")
            for k, v in topics.items()
        ]
        
        select = discord.ui.Select(placeholder="Select a topic...", options=options)
        
        async def callback(interaction):
            topic = select.values[0]
            answer = topics[topic]
            embed = create_container(title=f"FAQ: {topic.capitalize()}", color=Colors.PRIMARY)
            embed.set_description(answer)
            await interaction.response.send_message(embed=embed.build(), ephemeral=True)
            
        select.callback = callback
        view = discord.ui.View()
        view.add_item(select)
        
        await interaction.response.send_message("Choose a topic below:", view=view, ephemeral=True)

    @app_commands.command(name="help", description="Show all commands")
    async def help_command(self, interaction: discord.Interaction):
        # Ultra Advanced: Dynamic categorization
        embed = create_container(title=f"{Emojis.HELP} Command Center", color=Colors.PRIMARY).build()
        embed.description = "Here are the available command modules:"
        
        for cog_name, cog in self.bot.cogs.items():
            commands_list = [c.name for c in cog.walk_app_commands()]
            if commands_list:
                embed.add_field(
                    name=f"📂 {cog_name}", 
                    value=f"`{', '.join(commands_list)}`", 
                    inline=False
                )
                
        await interaction.response.send_message(embed=embed)

async def setup(bot):
    await bot.add_cog(Utility(bot))

