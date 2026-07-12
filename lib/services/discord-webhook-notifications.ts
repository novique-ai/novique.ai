/**
 * Discord Webhook notification service for instant customer alerts
 * Posts directly to Discord channel via incoming webhook - no local server needed!
 */

interface WebhookResponse {
  success: boolean;
  error?: string;
}

interface ConsultationWebhookData {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  businessType?: string;
  businessSize?: string;
  meetingType?: string;
  challenges?: string;
}

interface RoiAssessmentWebhookData {
  id: string;
  name?: string;
  email: string;
  score?: number;
  company?: string;
  industry?: string;
  netBenefit?: number;
  roi?: number;
  paybackMonths?: number;
}

interface SocialPublishAlertData {
  kind: 'dead_letter' | 'needs_review' | 'stale_publishing';
  postId: string;
  message: string;
  attempts?: number;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

class DiscordWebhookNotificationService {
  private discordWebhookUrl?: string;
  private timeout: number;

  constructor() {
    this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    this.timeout = parseInt(process.env.DISCORD_WEBHOOK_TIMEOUT || '10000');
  }

  /**
   * Send consultation request notification
   */
  async consultationRequest(data: ConsultationWebhookData): Promise<WebhookResponse> {
    const embed: DiscordEmbed = {
      title: "🤝 New Consultation Request",
      color: 0x0891b2, // Cyan color
      fields: [
        {
          name: "👤 Contact",
          value: `**${data.name}**\n📧 ${data.email}${data.phone ? `\n📞 ${data.phone}` : ''}`,
          inline: true
        },
        {
          name: "🏢 Business",
          value: `**Type:** ${data.businessType || 'Not specified'}\n**Size:** ${data.businessSize || 'Not specified'}`,
          inline: true
        }
      ],
      footer: {
        text: `ID: ${data.id} • novique.ai`
      },
      timestamp: new Date().toISOString()
    };

    if (data.meetingType) {
      embed.fields!.push({
        name: "📅 Meeting Preference",
        value: data.meetingType,
        inline: true
      });
    }

    if (data.challenges) {
      embed.fields!.push({
        name: "💼 Challenges",
        value: data.challenges.length > 100 
          ? data.challenges.substring(0, 100) + "..." 
          : data.challenges,
        inline: false
      });
    }

    const payload: DiscordWebhookPayload = {
      content: `🚨 **New consultation request from ${data.name}**`,
      embeds: [embed]
    };

    return this.sendDiscordWebhook(payload);
  }

  /**
   * Send ROI assessment notification with calculated score
   */
  async roiAssessment(data: RoiAssessmentWebhookData): Promise<WebhookResponse> {
    const scoreColor = this.getScoreColor(data.score || 0);
    const scoreBadge = this.getScoreBadge(data.score || 0);

    const embed: DiscordEmbed = {
      title: `📊 New ROI Assessment ${scoreBadge}`,
      color: scoreColor,
      fields: [
        {
          name: "👤 Contact",
          value: `**${data.name || data.email.split('@')[0]}**\n📧 ${data.email}`,
          inline: true
        }
      ],
      footer: {
        text: `ID: ${data.id} • novique.ai`
      },
      timestamp: new Date().toISOString()
    };

    if (data.company || data.industry) {
      embed.fields!.push({
        name: "🏢 Company",
        value: data.company || data.industry || 'Not specified',
        inline: true
      });
    }

    if (data.score !== undefined) {
      embed.fields!.push({
        name: "📈 ROI Score",
        value: `**${data.score}/100** ${this.getScoreEmoji(data.score)}`,
        inline: true
      });
    }

    // Add financial metrics if available
    const metrics: string[] = [];
    if (data.roi !== undefined) {
      metrics.push(`**ROI:** ${data.roi.toFixed(0)}%`);
    }
    if (data.netBenefit !== undefined) {
      metrics.push(`**Net Benefit:** $${data.netBenefit.toLocaleString()}/mo`);
    }
    if (data.paybackMonths !== undefined) {
      metrics.push(`**Payback:** ${data.paybackMonths.toFixed(1)} months`);
    }

    if (metrics.length > 0) {
      embed.fields!.push({
        name: "💰 Projections",
        value: metrics.join('\n'),
        inline: false
      });
    }

    const payload: DiscordWebhookPayload = {
      content: `🚨 **New ROI assessment from ${data.email}** ${scoreBadge}`,
      embeds: [embed]
    };

    return this.sendDiscordWebhook(payload);
  }

  /**
   * Send SMS notification
   */
  async smsNotification(data: { id: string; from: string; body: string }): Promise<WebhookResponse> {
    const preview = data.body.length > 100 
      ? data.body.substring(0, 100) + "..."
      : data.body;

    const embed: DiscordEmbed = {
      title: "💬 New SMS Message",
      color: 0x22c55e, // Green color
      fields: [
        {
          name: "📱 From",
          value: data.from,
          inline: true
        },
        {
          name: "💬 Message",
          value: `"${preview}"`,
          inline: false
        }
      ],
      footer: {
        text: `ID: ${data.id} • novique.ai`
      },
      timestamp: new Date().toISOString()
    };

    const payload: DiscordWebhookPayload = {
      content: `🚨 **New SMS from ${data.from}**`,
      embeds: [embed]
    };

    return this.sendDiscordWebhook(payload);
  }

  /**
   * Send voicemail notification
   */
  async voicemailNotification(data: { id: string; from: string; duration?: number }): Promise<WebhookResponse> {
    const embed: DiscordEmbed = {
      title: "📞 New Voicemail",
      color: 0x8b5cf6, // Purple color
      fields: [
        {
          name: "📱 From",
          value: data.from,
          inline: true
        }
      ],
      footer: {
        text: `ID: ${data.id} • novique.ai`
      },
      timestamp: new Date().toISOString()
    };

    if (data.duration) {
      embed.fields!.push({
        name: "⏱️ Duration",
        value: `${data.duration} seconds`,
        inline: true
      });
    }

    const payload: DiscordWebhookPayload = {
      content: `🚨 **New voicemail from ${data.from}**`,
      embeds: [embed]
    };

    return this.sendDiscordWebhook(payload);
  }

  /**
   * Send test notification
   */
  async test(): Promise<WebhookResponse> {
    const embed: DiscordEmbed = {
      title: "🧪 Webhook Test",
      description: "Discord webhook integration is working!",
      color: 0x3b82f6, // Blue color
      fields: [
        {
          name: "🚀 Status",
          value: "✅ Connection successful",
          inline: true
        },
        {
          name: "🕐 Time",
          value: new Date().toLocaleTimeString(),
          inline: true
        }
      ],
      footer: {
        text: "novique.ai webhook test"
      },
      timestamp: new Date().toISOString()
    };

    const payload: DiscordWebhookPayload = {
      content: "🧪 **Webhook test notification**",
      embeds: [embed]
    };

    return this.sendDiscordWebhook(payload);
  }

  /**
   * Send an operational alert for the social publishing queue.
   */
  async socialPublishAlert(data: SocialPublishAlertData): Promise<WebhookResponse> {
    const titles: Record<SocialPublishAlertData['kind'], string> = {
      dead_letter: 'Social post exhausted its publish retries',
      needs_review: 'Social post requires manual review',
      stale_publishing: 'Stale social publish recovered',
    };
    const fields: NonNullable<DiscordEmbed['fields']> = [
      { name: 'Post ID', value: data.postId, inline: false },
    ];

    if (data.attempts !== undefined) {
      fields.push({ name: 'Attempts', value: String(data.attempts), inline: true });
    }

    return this.sendDiscordWebhook({
      content: `Social publishing alert: **${titles[data.kind]}**`,
      embeds: [
        {
          title: titles[data.kind],
          description: data.message.slice(0, 4000),
          color: data.kind === 'stale_publishing' ? 0xf59e0b : 0xef4444,
          fields,
          footer: { text: 'novique.ai social publish queue' },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  /**
   * Send webhook to Discord
   */
  private async sendDiscordWebhook(payload: DiscordWebhookPayload): Promise<WebhookResponse> {
    if (!this.discordWebhookUrl) {
      console.error('❌ DISCORD_WEBHOOK_URL not configured');
      return { 
        success: false, 
        error: 'Discord webhook URL not configured' 
      };
    }

    try {
      console.log('📡 Sending Discord webhook notification');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Discord webhook sent successfully');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Discord webhook failed:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }

    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Discord webhook timeout' 
        : 'Network error';

      console.error('⚠️ Discord webhook exception:', { 
        error: errorMessage,
        type: error.name 
      });

      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Get color based on ROI score
   */
  private getScoreColor(score: number): number {
    if (score >= 80) return 0x22c55e; // Green - High value
    if (score >= 60) return 0xf59e0b; // Yellow - Medium value  
    if (score >= 40) return 0xef4444; // Red - Low value
    return 0x6b7280; // Gray - No score
  }

  /**
   * Get badge emoji based on ROI score
   */
  private getScoreBadge(score: number): string {
    if (score >= 80) return "🔥";
    if (score >= 60) return "⭐";
    if (score >= 40) return "📈";
    return "📊";
  }

  /**
   * Get emoji based on ROI score
   */
  private getScoreEmoji(score: number): string {
    if (score >= 90) return "🚀";
    if (score >= 80) return "🔥";
    if (score >= 70) return "⭐";
    if (score >= 60) return "👍";
    if (score >= 50) return "📈";
    return "📊";
  }

  /**
   * Calculate ROI score for notification
   * This is a simplified scoring algorithm based on calculated ROI metrics
   */
  static calculateRoiScore(results: any): number {
    try {
      const { roiPercent, paybackMonths, netBenefitPerMonth } = results;
      
      let score = 0;

      // ROI Percentage (40% of score)
      if (roiPercent >= 300) score += 40;
      else if (roiPercent >= 200) score += 30;
      else if (roiPercent >= 100) score += 20;
      else if (roiPercent >= 50) score += 10;

      // Payback Period (30% of score) - shorter is better
      if (paybackMonths <= 3) score += 30;
      else if (paybackMonths <= 6) score += 25;
      else if (paybackMonths <= 12) score += 20;
      else if (paybackMonths <= 24) score += 10;

      // Net Monthly Benefit (30% of score)
      if (netBenefitPerMonth >= 10000) score += 30;
      else if (netBenefitPerMonth >= 5000) score += 25;
      else if (netBenefitPerMonth >= 2500) score += 20;
      else if (netBenefitPerMonth >= 1000) score += 15;
      else if (netBenefitPerMonth >= 500) score += 10;

      return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
    } catch (error) {
      console.error('Error calculating ROI score:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const discordWebhookNotifications = new DiscordWebhookNotificationService();

// Export class for testing
export { DiscordWebhookNotificationService };

export type { 
  ConsultationWebhookData, 
  RoiAssessmentWebhookData, 
  SocialPublishAlertData,
  WebhookResponse 
};
