// FormattingService.ts
// Utility functions for formatting data for display

export class FormattingService {
  static formatCurrency(copper: number, silver: number, gold: number): string {
    const parts = [];
    if (gold > 0) parts.push(`${gold}g`);
    if (silver > 0) parts.push(`${silver}s`);
    if (copper > 0) parts.push(`${copper}c`);
    return parts.join(' ') || '0c';
  }

  static formatTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  static formatDate(day: number): string {
    return `Day ${day}`;
  }

  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  static formatWeight(weight: number): string {
    return `${weight.toFixed(1)}kg`;
  }

  static formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  static formatSkillLevel(level: number, xp: number, nextLevelXp?: number): string {
    let result = `Level ${level}`;
    if (nextLevelXp) {
      result += ` (${xp}/${nextLevelXp} XP)`;
    }
    return result;
  }
}
