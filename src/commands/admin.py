import discord
from discord import app_commands
from discord.ext import commands
from typing import Literal
from ..utils.base_cog import BaseCog
from ..utils.embeds import EmbedUtils
from ..utils.constants import Emojis, Colors
from ..utils.components_v2 import create_container

class Admin(BaseCog):
    def __init__(self, bot):
        super().__init__(bot)

    @app_commands.command(name="admin", description="Administration commands")
    async def admin_config(self, interaction: discord.Interaction, action: Literal['view_config', 'set_log']):
        if not interaction.user.guild_permissions.administrator:
            return await interaction.response.send_message("Admin only.", ephemeral=True)
            
        await interaction.response.defer(ephemeral=True)
        
        if action == 'view_config':
            # In a real app, fetch from DB
            config = {
                "Staff Role": "@Staff",
                "Log Channel": "#logs",
                "Store API Integration": "Enabled"
            }
            
            embed = create_container(title=f"{Emojis.ADMIN} Server Configuration", color=Colors.SECONDARY).build()
            for k, v in config.items():
                embed.add_field(name=k, value=v, inline=True)
            
            await interaction.followup.send(embed=embed)
        else:
             await interaction.followup.send("Config feature not fully implemented in demo.")

    @app_commands.command(name="blacklist", description="Manage user blacklist")
    async def blacklist(self, interaction: discord.Interaction, action: Literal['add', 'remove', 'list'], user: discord.Member):
        if not interaction.user.guild_permissions.manage_guild:
             return await interaction.response.send_message("Unauthorized.", ephemeral=True)

        # Mock DB logic
        if action == 'add':
            await interaction.response.send_message(embed=EmbedUtils.success("Blacklisted", f"{user.mention} has been blacklisted."), ephemeral=True)
        elif action == 'remove':
             await interaction.response.send_message(embed=EmbedUtils.success("Unblacklisted", f"{user.mention} removed from blacklist."), ephemeral=True)
        else:
             await interaction.response.send_message("Blacklist empty.", ephemeral=True)

    @app_commands.command(name="webhook", description="Test Webhook")
    async def webhook(self, interaction: discord.Interaction):
        if not interaction.user.guild_permissions.administrator:
             return await interaction.response.send_message("Admin only.", ephemeral=True)
             
        # Test store webhook simulation
        await interaction.response.send_message(embed=EmbedUtils.info("Webhook Test", "Simulating purchase webhook..."), ephemeral=True)
        
        # Simulate an event (e.g., successful purchase)
        channel = discord.utils.get(interaction.guild.text_channels, name="orders") # Example
        if channel:
             embed = create_container(title=f"{Emojis.SUCCESS} New Order!", color=Colors.SUCCESS)
             embed.add_field("Product", "Lifetime Key", True)
             embed.add_field("Customer", "hidden@email.com", True)
             embed.add_field("Value", "$19.99", True)
             await channel.send(embed=embed.build())
    
    @app_commands.command(name="set-welcome", description="Set the channel for welcome messages")
    @app_commands.describe(channel="The channel to send welcome images to")
    async def set_welcome(self, interaction: discord.Interaction, channel: discord.TextChannel):
        if not interaction.user.guild_permissions.administrator:
            return await interaction.response.send_message("Admin only.", ephemeral=True)
            
        await interaction.response.defer(ephemeral=True)
        
        from ..services.database import GuildConfig
        
        await GuildConfig.update_or_create(
            id=str(interaction.guild_id),
            defaults={
                "welcome_channel_id": str(channel.id)
            }
        )
        
        await interaction.followup.send(
            embed=EmbedUtils.success(
                "Welcome Channel Set", 
                f"Welcome messages will now be sent to {channel.mention}"
            )
        )

    @app_commands.command(name="testwrlecomw", description="Send a test welcome card")
    async def test_welcome(self, interaction: discord.Interaction):
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            return await interaction.response.send_message("Guild only.", ephemeral=True)
        if not interaction.user.guild_permissions.administrator:
            return await interaction.response.send_message("Admin only.", ephemeral=True)

        await interaction.response.defer()

        from ..utils.welcome_card import build_welcome_card_file

        try:
            file = await build_welcome_card_file(self.bot, interaction.user)
            await interaction.followup.send(
                f"Test welcome card for {interaction.user.mention}.",
                file=file,
            )
        except Exception as e:
            await interaction.followup.send(
                embed=EmbedUtils.error("Welcome Card Error", str(e)),
                ephemeral=True,
            )

async def setup(bot):
    await bot.add_cog(Admin(bot))
