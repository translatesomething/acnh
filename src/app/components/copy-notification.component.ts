import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AnimationBuilder, animate, style, transition } from '@angular/animations';

@Component({
  selector: 'app-copy-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="copy-notification">
      <mat-icon>check_circle</mat-icon>
      <span>Copied!</span>
    </div>
  `,
  styles: [`
    .copy-notification {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--acnh-green);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 1000;
    }

    mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class CopyNotificationComponent {
  private builder = inject(AnimationBuilder);

  show(container: HTMLElement) {
    const animation = this.builder.build([
      style({ opacity: 0, transform: 'translate(-50%, 20px)' }),
      animate('150ms ease-out', style({ opacity: 1, transform: 'translate(-50%, 0)' })),
      animate('1000ms', style({ opacity: 1 })),
      animate('150ms ease-in', style({ opacity: 0, transform: 'translate(-50%, -20px)' }))
    ]);

    const player = animation.create(container);
    player.play();
    player.onDone(() => {
      container.remove();
    });
  }
} 