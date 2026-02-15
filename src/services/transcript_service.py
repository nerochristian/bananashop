import discord
from discord.ext import commands
import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple, Union
import aiohttp
import asyncio
from ..utils.logger import logger
from ..utils.constants import Colors
from ..utils.transcript_template import HTML_TEMPLATE


def escape_html(text: str) -> str:
    """Escape HTML characters."""
    if not text:
        return ""
    return (text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#39;"))


def format_timestamp(dt: datetime) -> str:
    """Format datetime for display."""
    if not dt:
        return ""
    return dt.strftime("%d-%m-%Y %H:%M")


def format_timestamp_long(dt: datetime) -> str:
    """Format datetime with full details."""
    if not dt:
        return ""
    return dt.strftime("%A, %d %B %Y %H:%M")


def format_timestamp_footer(dt: datetime) -> str:
    """Format datetime for footer."""
    if not dt:
        return ""
    return dt.strftime("%d %B %Y at %H:%M:%S")


def parse_markdown_basic(text: str) -> str:
    """Convert basic Discord markdown to HTML."""
    if not text:
        return ""
    
    text = escape_html(text)
    
    # Bold: **text**
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    # Italic: *text* or _text_
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'_(.+?)_', r'<em>\1</em>', text)
    # Underline: __text__
    text = re.sub(r'__(.+?)__', r'<u>\1</u>', text)
    # Strikethrough: ~~text~~
    text = re.sub(r'~~(.+?)~~', r'<s>\1</s>', text)
    # Inline code: `code`
    text = re.sub(r'`([^`]+)`', r'<span class="pre pre--inline">\1</span>', text)
    # Code blocks: ```code```
    text = re.sub(r'```(\w+)?\n?(.*?)```', r'<div class="pre pre--multiline">\2</div>', text, flags=re.DOTALL)
    # Links: [text](url)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    # Line breaks
    text = text.replace('\n', '<br>')
    
    return text


def format_mention(text: str) -> str:
    """Format Discord mentions in text."""
    if not text:
        return ""
    
    # User mentions: <@123456789>
    text = re.sub(
        r'<@!?(\d+)>',
        r'<span class="mention" title="\1">@User</span>',
        text
    )
    # Role mentions: <@&123456789>
    text = re.sub(
        r'<@&(\d+)>',
        r'<span class="mention" title="\1">@Role</span>',
        text
    )
    # Channel mentions: <#123456789>
    text = re.sub(
        r'<#(\d+)>',
        r'<span class="mention" title="\1">#channel</span>',
        text
    )
    
    return text


def get_avatar_url(user: Union[discord.User, discord.Member]) -> str:
    """Get user avatar URL or default."""
    try:
        display_avatar = getattr(user, "display_avatar", None)
        if display_avatar:
            return str(display_avatar.url)
    except Exception:
        pass
    if getattr(user, "avatar", None):
        return str(user.avatar.url)
    return f"https://cdn.discordapp.com/embed/avatars/{int(user.id) % 5}.png"


def get_guild_icon_url(guild: discord.Guild) -> str:
    """Get guild icon URL or default."""
    if guild.icon:
        return str(guild.icon.url)
    return "https://cdn.discordapp.com/embed/avatars/0.png"


def format_sticker_html(sticker: discord.StickerItem) -> str:
    """Format sticker to HTML."""
    if not sticker.url:
        return ""
    return f'''
    <div class="chatlog__sticker">
        <img class="chatlog__sticker-image" src="{sticker.url}" alt="{escape_html(sticker.name)}" title="{escape_html(sticker.name)}">
    </div>
    '''


def format_embed_html(embed: discord.Embed) -> str:
    """Convert a Discord embed to HTML."""
    color = f"rgba({(embed.color.value >> 16) & 255}, {(embed.color.value >> 8) & 255}, {embed.color.value & 255}, 1)" if embed.color else "rgba(79, 84, 92, 1)"
    
    html_parts = [f'<div class="chatlog__embed">']
    html_parts.append(f'<div class="chatlog__embed-color-pill" style="background-color:{color}"></div>')
    html_parts.append('<div class="chatlog__embed-content-container">')
    html_parts.append('<div class="chatlog__embed-content">')
    html_parts.append('<div class="chatlog__embed-text">')
    
    # Author
    if embed.author and embed.author.name:
        author_icon = f'<img class="chatlog__embed-author-icon" src="{embed.author.icon_url}" alt="Author Icon">' if embed.author.icon_url else ""
        html_parts.append(f'<div class="chatlog__embed-author">{author_icon}<span class="chatlog__embed-author-name">{escape_html(embed.author.name)}</span></div>')
    
    # Title
    if embed.title:
        title_html = escape_html(embed.title)
        if embed.url:
            title_html = f'<a class="chatlog__embed-title-link" href="{embed.url}">{title_html}</a>'
        html_parts.append(f'<div class="chatlog__embed-title">{title_html}</div>')
    
    # Description
    if embed.description:
        html_parts.append(f'<div class="chatlog__embed-description"><span class="markdown preserve-whitespace">{parse_markdown_basic(embed.description)}</span></div>')
    
    # Fields
    if embed.fields:
        html_parts.append('<div class="chatlog__embed-fields">')
        for field in embed.fields:
            inline_class = " chatlog__embed-field--inline" if field.inline else ""
            html_parts.append(f'<div class="chatlog__embed-field{inline_class}">')
            html_parts.append(f'<div class="chatlog__embed-field-name"><span class="markdown preserve-whitespace">{escape_html(field.name)}</span></div>')
            html_parts.append(f'<div class="chatlog__embed-field-value"><span class="markdown preserve-whitespace">{parse_markdown_basic(field.value)}</span></div>')
            html_parts.append('</div>')
        html_parts.append('</div>')
    
    html_parts.append('</div>')  # embed-text
    
    # Thumbnail
    if embed.thumbnail and embed.thumbnail.url:
        html_parts.append(f'<img class="chatlog__embed-thumbnail" src="{embed.thumbnail.url}" alt="Thumbnail">')
    
    html_parts.append('</div>')  # embed-content
    
    # Image
    if embed.image and embed.image.url:
        html_parts.append(f'<div class="chatlog__embed-image-container"><img class="chatlog__embed-image" src="{embed.image.url}" alt="Image"></div>')
    
    # Footer
    if embed.footer and (embed.footer.text or embed.timestamp):
        footer_text = escape_html(embed.footer.text) if embed.footer.text else ""
        if embed.timestamp:
            ts = format_timestamp_long(embed.timestamp)
            if footer_text:
                footer_text += f" • {ts}"
            else:
                footer_text = ts
                
        footer_icon = f'<img class="chatlog__embed-footer-icon" src="{embed.footer.icon_url}">' if embed.footer and embed.footer.icon_url else ""
        html_parts.append(f'<div class="chatlog__embed-footer">{footer_icon}<span class="chatlog__embed-footer-text">{footer_text}</span></div>')
    
    html_parts.append('</div>')  # embed-content-container
    html_parts.append('</div>')  # embed
    
    return '\n'.join(html_parts)


def format_attachment_html(attachment: discord.Attachment) -> str:
    """Convert a Discord attachment to HTML."""
    if attachment.content_type and attachment.content_type.startswith('image/'):
        return f'''
        <div class="chatlog__attachment">
            <a href="{attachment.url}" target="_blank">
                <img class="chatlog__attachment-thumbnail" src="{attachment.url}" alt="{escape_html(attachment.filename)}">
            </a>
        </div>
        '''
    elif attachment.content_type and attachment.content_type.startswith('audio/'):
        return f'''
        <div class="chatlog__attachment-audio-container">
            <span class="chatlog__attachment-filename">{escape_html(attachment.filename)}</span>
            <audio controls src="{attachment.url}"></audio>
        </div>
        '''
    elif attachment.content_type and attachment.content_type.startswith('video/'):
        return f'''
        <div class="chatlog__attachment-video-container">
            <span class="chatlog__attachment-filename">{escape_html(attachment.filename)}</span>
            <video controls src="{attachment.url}" width="400" style="max-width: 100%"></video>
        </div>
        '''
    else:
        size_str = f"{attachment.size / 1024:.1f} KB" if attachment.size < 1024 * 1024 else f"{attachment.size / (1024*1024):.1f} MB"
        return f'''
        <div class="chatlog__attachment-container">
            <img class="chatlog__attachment-icon" src="https://cdn.jsdelivr.net/gh/mahtoid/DiscordUtils@master/discord-attachment.svg" alt="Attachment">
            <div class="chatlog__attachment-filename"><a href="{attachment.url}" target="_blank">{escape_html(attachment.filename)}</a></div>
            <div class="chatlog__attachment-filesize">{size_str}</div>
        </div>
        '''


def format_components_html(components: List[discord.ui.ActionRow]) -> str:
    """Convert Discord components (buttons) to HTML."""
    if not components:
        return ""
    
    html_parts = ['<div class="chatlog__components">']
    
    for row in components:
        if hasattr(row, 'children'):
            for child in row.children:
                if isinstance(child, discord.ui.Button):
                    style_colors = {
                        discord.ButtonStyle.primary: "#5865f2",
                        discord.ButtonStyle.secondary: "#4f545c",
                        discord.ButtonStyle.success: "#2D7D46",
                        discord.ButtonStyle.danger: "#D83C3E",
                        discord.ButtonStyle.link: "#4f545c",
                    }
                    color = style_colors.get(child.style, "#4f545c")
                    label = escape_html(child.label) if child.label else ""
                    
                    emoji_html = ""
                    if child.emoji:
                        if hasattr(child.emoji, 'url'):
                             emoji_html = f'<img class="emoji emoji--small" src="{child.emoji.url}">'
                        else:
                             emoji_html = str(child.emoji)

                    disabled = " chatlog__component-disabled" if child.disabled else ""
                    
                    html_parts.append(f'''
                    <div class="chatlog__component-button{disabled}" style="background-color:{color}">
                        <a href="javascript:;" style="text-decoration:none">
                            <span class="chatlog__button-label">{emoji_html}{label}</span>
                        </a>
                    </div>
                    ''')
    
    html_parts.append('</div>')
    return '\n'.join(html_parts)


def format_reactions_html(reactions: List[discord.Reaction]) -> str:
    """Convert Discord reactions to HTML."""
    if not reactions:
        return ""
    
    html_parts = ['<div class="chatlog__reactions">']
    
    for reaction in reactions:
        emoji_html = f'<img class="emoji emoji--small" src="{reaction.emoji.url}">' if hasattr(reaction.emoji, 'url') else str(reaction.emoji)
        html_parts.append(f'''
        <div class="chatlog__reaction">
            {emoji_html}
            <span class="chatlog__reaction-count">{reaction.count}</span>
        </div>
        ''')
    
    html_parts.append('</div>')
    return '\n'.join(html_parts)


def format_message_html(message: discord.Message, is_continuation: bool = False) -> str:
    """Format a single message as HTML."""
    # Special handling for system messages
    if message.type != discord.MessageType.default and message.type != discord.MessageType.reply:
         return f'''
            <div class="chatlog__message-group">
                <div class="chatlog__message">
                     <div class="chatlog__message-aside"><div class="chatlog__pin-avatar-container"><img class="chatlog__pin-avatar" src="https://cdn.discordapp.com/embed/avatars/0.png" alt="System"></div></div>
                     <div class="chatlog__message-primary">
                         <div class="chatlog__content chatlog__markdown">
                             <span class="chatlog__system-message">System Message: {escape_html(message.system_content or "System event")}</span>
                         </div>
                     </div>
                </div>
            </div>
         '''

    author = message.author
    avatar_url = get_avatar_url(author)
    author_color = f"#{author.color.value:06x}" if author.color and author.color.value else "#ffffff"
    
    # Bot tag
    bot_tag = ""
    if author.bot:
        bot_tag = '''
        <span class="chatlog__bot-tag">
            <svg class="chatlog__bot-tag-verified" height="16" viewBox="0 0 16 15.2">
                <path d="M7.4,11.17,4,8.62,5,7.26l2,1.53L10.64,4l1.36,1Z" fill="#ffffff"></path>
            </svg>
            <span>APP</span>
        </span>
        '''
    
    # Message content
    content_html = ""
    if message.content:
        content = parse_markdown_basic(message.content)
        content = format_mention(content)
        content_html = f'<span class="chatlog__markdown-preserve">{content}</span>'
    
    # Edited indicator
    edited = ""
    if message.edited_at:
        edited = f'<span class="chatlog__reference-edited-timestamp" data-timestamp="{format_timestamp_long(message.edited_at)}">(edited)</span>'
    
    # Embeds
    embeds_html = ""
    for embed in message.embeds:
        embeds_html += format_embed_html(embed)
    
    # Attachments
    attachments_html = ""
    for attachment in message.attachments:
        attachments_html += format_attachment_html(attachment)
    
    # Stickers
    stickers_html = ""
    if message.stickers:
        for sticker in message.stickers:
            stickers_html += format_sticker_html(sticker)
    
    # Components (buttons)
    components_html = ""
    if message.components:
        components_html = format_components_html(message.components)

    if not content_html and not embeds_html and not attachments_html and not stickers_html and not components_html:
        if message.components:
            content_html = '<span class="chatlog__system-message">Interactive message (components-only)</span>'
    
    # Reactions
    reactions_html = ""
    if message.reactions:
        reactions_html = format_reactions_html(message.reactions)
    
    # Reference (reply)
    reference_html = ""
    if message.reference and message.reference.message_id:
        reference_html = f'''
        <div class="chatlog__followup">
            <div class="chatlog__followup-symbol"></div>
            <span class="chatlog__reference-link" onclick="scrollToMessage(event, '{message.reference.message_id}')">
                Replying to a message
            </span>
        </div>
        '''
    
    if is_continuation:
        # Continuation message (same author, within timeframe)
        return f'''
        <div id="chatlog__message-container-{message.id}" class="chatlog__message-container" data-message-id="{message.id}">
            <div class="chatlog__message">
                <div class="chatlog__message-aside">
                    <div class="chatlog__short-timestamp" data-timestamp="{format_timestamp_long(message.created_at)}">{message.created_at.strftime("%H:%M")}</div>
                </div>
                <div class="chatlog__message-primary">
                    <div class="chatlog__content chatlog__markdown" data-message-id="{message.id}" id="message-{message.id}">
                        {content_html}
                        {edited}
                        {stickers_html}
                        {embeds_html}
                        {attachments_html}
                        {components_html}
                        {reactions_html}
                    </div>
                </div>
            </div>
        </div>
        '''
    else:
        # New message group
        return f'''
        <div id="chatlog__message-container-{message.id}" class="chatlog__message-container" data-message-id="{message.id}">
            <div class="chatlog__message">
                <div class="chatlog__message-aside">
                    <img class="chatlog__avatar" src="{avatar_url}" data-user-id="{author.id}" />
                </div>
                <div class="chatlog__message-primary">
                    <div class="chatlog__header">
                        <span class="chatlog__author-name" title="{escape_html(author.name)}" data-user-id="{author.id}" style="color: {author_color};">{escape_html(author.display_name)}</span>
                        {bot_tag}
                        <span class="chatlog__timestamp" data-timestamp="{format_timestamp_long(message.created_at)}">{format_timestamp(message.created_at)}</span>
                    </div>
                    {reference_html}
                    <div class="chatlog__content chatlog__markdown" data-message-id="{message.id}" id="message-{message.id}">
                        {content_html}
                        {edited}
                        {stickers_html}
                        {embeds_html}
                        {attachments_html}
                        {components_html}
                        {reactions_html}
                    </div>
                </div>
            </div>
        </div>
        '''


def generate_user_popout_html(user: discord.Member, message_count: int, guild: discord.Guild) -> str:
    """Generate user popout HTML."""
    avatar_url = get_avatar_url(user)
    guild_icon = get_guild_icon_url(guild)
    
    bot_tag = ""
    if user.bot:
        bot_tag = '''
        <span class="chatlog__bot-tag">
            <svg class="chatlog__bot-tag-verified" height="16" viewBox="0 0 16 15.2">
                <path d="M7.4,11.17,4,8.62,5,7.26l2,1.53L10.64,4l1.36,1Z" fill="#ffffff"></path>
            </svg>
            <span>APP</span>
        </span>
        '''
    
    created_at = user.created_at.strftime("%b %d, %Y") if user.created_at else "Unknown"
    joined_at = user.joined_at.strftime("%b %d, %Y") if user.joined_at else "Unknown"
    
    return f'''
    <div id="meta-popout-{user.id}" class="meta-popout">
        <div class="meta__header">
             <img src="{avatar_url}" alt="Avatar">
        </div>
        <div class="meta__description">
            <div class="meta__display-name">{escape_html(user.display_name)}</div>
            <div class="meta__details">
                <div class="meta__user">{escape_html(user.name)}</div>
                <div class="meta__discriminator"></div>
                {bot_tag}
            </div>
            <div class="meta__divider-2"></div>
            <div class="meta__field">
                <div class="meta__title">Member Since</div>
                <div class="meta__value">
                    <img src="https://cdn.jsdelivr.net/gh/mahtoid/DiscordUtils@master/discord-logo.svg"/> {created_at}
                    <div class="meta__divider"></div>
                    <img src="{guild_icon}" class="meta__img-border"/> {joined_at}
                </div>
            </div>
            <div class="meta__field">
                <div class="meta__title">Member ID</div>
                <div class="meta__value">{user.id}</div>
            </div>
            <div class="meta__field">
                <div class="meta__title">Message Count</div>
                <div class="meta__value">{message_count}</div>
            </div>
        </div>
    </div>
    '''


async def generate_transcript(channel: discord.TextChannel, limit: int = None) -> Dict[str, object]:
    """
    Generate an HTML transcript for a Discord channel.
    
    Args:
        channel: The Discord text channel to generate transcript for
        limit: Maximum number of messages to fetch (None = all)
    
    Returns:
        dict: A dictionary containing 'html', 'total_messages', and 'participants'.
    """
    guild = channel.guild
    guild_icon = get_guild_icon_url(guild)
    
    # Fetch messages
    messages: List[discord.Message] = []
    try:
        async for message in channel.history(limit=limit, oldest_first=True):
            messages.append(message)
    except Exception as e:
        logger.error(f"Failed to fetch messages for transcript: {e}")
        # Proceed with what we have
    
    # Count messages per user
    user_message_counts: Dict[int, int] = {}
    unique_users: Dict[int, Union[discord.Member, discord.User]] = {}
    
    for msg in messages:
        user_message_counts[msg.author.id] = user_message_counts.get(msg.author.id, 0) + 1
        # Only store if not already stored or if the stored one is a User and this one is a Member (Member has more info)
        if msg.author.id not in unique_users or isinstance(msg.author, discord.Member):
            unique_users[msg.author.id] = msg.author
    
    # Generate message HTML with grouping
    messages_html = ""
    last_author_id = None
    last_message_time = None
    message_group_open = False
    
    for msg in messages:
        # Handle system messages (break grouping)
        if msg.type != discord.MessageType.default and msg.type != discord.MessageType.reply:
            if message_group_open:
                messages_html += '</div>'
                message_group_open = False
            messages_html += format_message_html(msg, is_continuation=False)
            last_author_id = None # Reset author tracking
            continue

        # Check if this is a continuation (same author, within timeframe)
        is_continuation = False
        if last_author_id == msg.author.id and last_message_time:
            time_diff = (msg.created_at - last_message_time).total_seconds()
            is_continuation = time_diff < 420  # 7 minutes (Discord's grouping time)
        
        if not is_continuation:
            if message_group_open:
                messages_html += '</div>'  # Close previous group
            messages_html += '<div class="chatlog__message-group">'
            message_group_open = True
        
        try:
            messages_html += format_message_html(msg, is_continuation)
        except Exception as e:
            logger.error(f"Error formatting message {msg.id}: {e}")
            messages_html += f'<div class="chatlog__message-error">Error formatting message {msg.id}</div>'
        
        last_author_id = msg.author.id
        last_message_time = msg.created_at
    
    if message_group_open:
        messages_html += '</div>'  # Close last group
    
    # Generate user popouts
    user_popouts_html = ""
    for user_id, user in unique_users.items():
        if isinstance(user, discord.Member):
             user_popouts_html += generate_user_popout_html(user, user_message_counts.get(user_id, 0), guild)
    
    # Generate summary values
    channel_created = channel.created_at.strftime("%b %d, %Y (%H:%M:%S)") if channel.created_at else "Unknown"
    now = datetime.now(timezone.utc)
    
    # Fill variables in template (using .replace since it's safer than format() with so many braces in CSS/JS)
    final_html = HTML_TEMPLATE.replace("{channel_name}", escape_html(channel.name))
    final_html = final_html.replace("{channel_id}", str(channel.id))
    final_html = final_html.replace("{guild_name}", escape_html(guild.name))
    final_html = final_html.replace("{guild_id}", str(guild.id))
    final_html = final_html.replace("{guild_icon}", guild_icon)
    final_html = final_html.replace("{message_count}", str(len(messages)))
    final_html = final_html.replace("{participant_count}", str(len(unique_users)))
    final_html = final_html.replace("{generated_at}", format_timestamp_footer(now))
    final_html = final_html.replace("{created_at}", channel_created)
    
    # Insert dynamic content
    final_html = final_html.replace("{messages}", messages_html)
    final_html = final_html.replace("{user_popouts}", user_popouts_html)
    
    return {
        "html": final_html,
        "total_messages": len(messages),
        "participants": user_message_counts
    }
