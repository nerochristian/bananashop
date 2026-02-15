"""
Discord Components V2 Builder Pattern API.

This module provides Builder classes that match the user's desired API pattern.
These wrap discord.py's native UI components.
"""

import discord
from typing import Optional, List, Any
from enum import IntEnum


class SeparatorSpacingSize(IntEnum):
    """Separator spacing sizes."""
    Small = 1
    Large = 2


class ButtonStyle(IntEnum):
    """Button style mappings."""
    Primary = 1
    Secondary = 2
    Success = 3
    Danger = 4
    Link = 5


class MessageFlags:
    """Message flags for V2 components."""
    IsComponentsV2 = 1 << 15  # 32768


class ThumbnailBuilder:
    """Builder for creating thumbnail components."""
    
    def __init__(self):
        self._url: Optional[str] = None
    
    def setMediaUrl(self, url: str) -> 'ThumbnailBuilder':
        self._url = url
        return self
    
    def build(self) -> discord.ui.Thumbnail:
        return discord.ui.Thumbnail(self._url)


class TextDisplayBuilder:
    """Builder for creating text display components."""
    
    def __init__(self):
        self._content: str = ""
    
    def setContent(self, content: str) -> 'TextDisplayBuilder':
        self._content = content
        return self
    
    def build(self) -> discord.ui.TextDisplay:
        return discord.ui.TextDisplay(self._content)


class SeparatorBuilder:
    """Builder for creating separator components."""
    
    def __init__(self):
        self._spacing: discord.SeparatorSpacing = discord.SeparatorSpacing.small
    
    def setSpacing(self, size: SeparatorSpacingSize) -> 'SeparatorBuilder':
        if size == SeparatorSpacingSize.Large:
            self._spacing = discord.SeparatorSpacing.large
        else:
            self._spacing = discord.SeparatorSpacing.small
        return self
    
    def setDivider(self, divider: bool) -> 'SeparatorBuilder':
        """No-op for API compatibility - divider is not supported."""
        return self
    
    def build(self) -> discord.ui.Separator:
        return discord.ui.Separator(spacing=self._spacing)


class ButtonBuilder:
    """Builder for creating button components."""
    
    def __init__(self):
        self._label: str = ""
        self._style: discord.ButtonStyle = discord.ButtonStyle.secondary
        self._custom_id: Optional[str] = None
        self._emoji: Optional[str] = None
        self._url: Optional[str] = None
        self._disabled: bool = False
        self._callback = None
    
    def setLabel(self, label: str) -> 'ButtonBuilder':
        self._label = label
        return self
    
    def setStyle(self, style: ButtonStyle) -> 'ButtonBuilder':
        style_map = {
            ButtonStyle.Primary: discord.ButtonStyle.primary,
            ButtonStyle.Secondary: discord.ButtonStyle.secondary,
            ButtonStyle.Success: discord.ButtonStyle.success,
            ButtonStyle.Danger: discord.ButtonStyle.danger,
            ButtonStyle.Link: discord.ButtonStyle.link,
        }
        self._style = style_map.get(style, discord.ButtonStyle.secondary)
        return self
    
    def setCustomId(self, custom_id: str) -> 'ButtonBuilder':
        self._custom_id = custom_id
        return self
    
    def setEmoji(self, emoji: str) -> 'ButtonBuilder':
        self._emoji = emoji
        return self
    
    def setUrl(self, url: str) -> 'ButtonBuilder':
        self._url = url
        return self
    
    def setDisabled(self, disabled: bool) -> 'ButtonBuilder':
        self._disabled = disabled
        return self
    
    def setCallback(self, callback) -> 'ButtonBuilder':
        self._callback = callback
        return self
    
    def build(self) -> discord.ui.Button:
        btn = discord.ui.Button(
            label=self._label,
            style=self._style,
            custom_id=self._custom_id,
            emoji=self._emoji,
            url=self._url,
            disabled=self._disabled
        )
        if self._callback:
            btn.callback = self._callback
        return btn


class ActionRowBuilder:
    """Builder for creating action row components."""
    
    def __init__(self):
        self._components: List[Any] = []
    
    def addComponents(self, *components) -> 'ActionRowBuilder':
        for comp in components:
            if isinstance(comp, ButtonBuilder):
                self._components.append(comp.build())
            else:
                self._components.append(comp)
        return self
    
    def build(self) -> discord.ui.ActionRow:
        return discord.ui.ActionRow(*self._components)


class ContainerBuilder:
    """Builder for creating container components."""
    
    def __init__(self):
        self._children: List[Any] = []
        self._accent_color: Optional[int] = None
        self._accessory: Optional[discord.ui.Thumbnail] = None
        self._header_text: Optional[str] = None
    
    def setAccentColor(self, color: int) -> 'ContainerBuilder':
        self._accent_color = color
        return self
    
    def addAccessoryComponents(self, thumbnail: ThumbnailBuilder) -> 'ContainerBuilder':
        """Set the accessory thumbnail (appears in top-right via Section)."""
        self._accessory = thumbnail.build()
        return self
    
    def addTextDisplayComponents(self, text_display: TextDisplayBuilder) -> 'ContainerBuilder':
        """Add a text display. If accessory is set and no header yet, create Section."""
        if self._accessory and not self._header_text:
            # First text display with accessory = create Section
            self._header_text = text_display._content
            self._children.append(
                discord.ui.Section(
                    discord.ui.TextDisplay(self._header_text),
                    accessory=self._accessory
                )
            )
        else:
            self._children.append(text_display.build())
        return self
    
    def addSeparatorComponents(self, separator: SeparatorBuilder) -> 'ContainerBuilder':
        self._children.append(separator.build())
        return self
    
    def addActionRowComponents(self, action_row: ActionRowBuilder) -> 'ContainerBuilder':
        self._children.append(action_row.build())
        return self
    
    def build(self) -> discord.ui.Container:
        if self._accent_color is not None:
            return discord.ui.Container(*self._children, accent_color=self._accent_color)
        return discord.ui.Container(*self._children)


async def send_v2_message(channel, container: ContainerBuilder, accent_color: Optional[int] = None):
    """
    Send a Components V2 message using the builder pattern.
    
    Args:
        channel: The channel to send to
        container: A ContainerBuilder instance
        accent_color: Optional accent color for the container
    
    Returns:
        The sent message
    """
    if accent_color:
        container.setAccentColor(accent_color)
    
    view = discord.ui.LayoutView()
    view.add_item(container.build())
    
    return await channel.send(view=view)
