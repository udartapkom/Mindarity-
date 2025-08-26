import { Injectable } from '@nestjs/common';

export interface CaptchaChallenge {
  id: string;
  question: string;
  answer: number;
  expiresAt: Date;
}

@Injectable()
export class CaptchaService {
  private challenges: Map<string, CaptchaChallenge> = new Map();
  private readonly CHALLENGE_EXPIRY_MINUTES = 5;

  generateChallenge(): CaptchaChallenge {
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let num1: number, num2: number, answer: number;
    
    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 30) + 10;
        num2 = Math.floor(Math.random() * num1);
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        break;
      default:
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
    }
    
    const question = `${num1} ${operator} ${num2}`;
    const id = this.generateId();
    const expiresAt = new Date(Date.now() + this.CHALLENGE_EXPIRY_MINUTES * 60 * 1000);
    
    const challenge: CaptchaChallenge = {
      id,
      question,
      answer,
      expiresAt,
    };
    
    this.challenges.set(id, challenge);
    
    // Очищаем истекшие вызовы
    this.cleanupExpiredChallenges();
    
    return challenge;
  }

  verifyChallenge(challengeId: string, userAnswer: number): boolean {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      return false;
    }
    
    // Удаляем использованный вызов
    this.challenges.delete(challengeId);
    
    // Проверяем срок действия
    if (new Date() > challenge.expiresAt) {
      return false;
    }
    
    return challenge.answer === userAnswer;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private cleanupExpiredChallenges(): void {
    const now = new Date();
    for (const [id, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) {
        this.challenges.delete(id);
      }
    }
  }

  // Методы для совместимости с существующим кодом
  isCaptchaConfigured(type: 'google' | 'hcaptcha'): boolean {
    return false; // Локальная CAPTCHA всегда доступна
  }

  async verifyCaptcha(token: string, type: 'google' | 'hcaptcha'): Promise<boolean> {
    // Для локальной CAPTCHA используем формат: challengeId:answer
    const [challengeId, answer] = token.split(':');
    if (!challengeId || !answer) {
      return false;
    }
    
    return this.verifyChallenge(challengeId, parseInt(answer, 10));
  }
}
