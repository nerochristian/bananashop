import discord
from discord import app_commands
from discord.ext import commands
from typing import Literal, Optional
from ..utils.base_cog import BaseCog
from ..utils.embeds import EmbedUtils
from ..utils.constants import Emojis, Colors
from ..utils.components_v2 import create_container

class Marketing(BaseCog):
    def __init__(self, bot):
        super().__init__(bot)

    @app_commands.command(name="announce", description="Send a styled announcement")
    @app_commands.describe(
        message="The content", 
        title="Title of announcement", 
        type="Style of announcement",
        channel="Channel to verify sending (default: current)"
    )
    async def announce(self, interaction: discord.Interaction, title: str, message: str, type: Literal['general', 'maintenance', 'update', 'drop'] = 'general', channel: Optional[discord.TextChannel] = None):
        if not interaction.user.guild_permissions.administrator:
             await interaction.response.send_message(embed=EmbedUtils.error("Unauthorized", "You need admin permissions."), ephemeral=True)
             return

        target_channel = channel or interaction.channel
        
        # Style Config
        styles = {
            'general': (Colors.PRIMARY, "📢"),
            'maintenance': (Colors.WARNING, "🛠️"),
            'update': (Colors.INFO, "🔄"),
            'drop': (Colors.SUCCESS, "🚀")
        }
        
        color, icon = styles.get(type, (Colors.PRIMARY, "📢"))
        
        container = create_container(title=f"{icon} {title}", color=color)
        container.set_description(message)
        container.set_footer(f"Announced by {interaction.user.display_name}", icon_url=interaction.user.display_avatar.url)
        
        # Confirmation
        # In a real "ultra advanced" flow, checking user input via modal is better, but this is quick.
        await interaction.response.send_message(f"Sent announcement to {target_channel.mention}", ephemeral=True)
        await target_channel.send(embed=container.build())

    @app_commands.command(name="analytics", description="View sales analytics")
    async def analytics(self, interaction: discord.Interaction, timeframe: Literal['24h', '7d', '30d'] = '30d'):
        await interaction.response.defer(ephemeral=True)
        
        # Mock Data
        data = {
            "revenue": 1259.50,
            "orders": 142,
            "top_product": "Lifetime Key",
            "conversion": "4.2%"
        }
        
        embed = create_container(title=f"{Emojis.ANALYTICS} Sales Analytics ({timeframe})", color=Colors.INFO).build()
        
        # "Ultra Advanced" ASCII Chart
        chart = (
            "```\n"
            "      |\n"
            "$$$   |       _.-.\n"
            "      |   _.-'    `._\n"
            "      |.-'\n"
            "______|__________________\n"
            "      |  T1  T2  T3  T4\n"
            "```"
        )
        
        embed.description = chart
        embed.add_field(name="💰 Total Revenue", value=f"`${data['revenue']}`", inline=True)
        embed.add_field(name="📦 Total Orders", value=f"`{data['orders']}`", inline=True)
        embed.add_field(name="📊 Conversion", value=f"`{data['conversion']}`", inline=True)
        embed.add_field(name="🏆 Best Seller", value=data['top_product'], inline=False)
        
        await interaction.followup.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Marketing(bot))
