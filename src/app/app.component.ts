import { Component, OnInit, Inject, ViewContainerRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ApiService } from './api.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getFullGameName } from './utils/game-mapping';
import { CopyNotificationComponent } from './components/copy-notification.component';

// Add interfaces for type safety
interface Villager {
  name: string;
  image_url: string;
  species: string;
  personality: string;
  gender: string;
  birthday_month: string;
  birthday_day: string;
  phrase: string;
  appearances: string[];
  coffee_preference?: string;
  house_interior_url?: string;
}

@Component({
  selector: 'app-villager-details',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule
  ],
  template: `
    <div class="villager-details">
      <h2>{{ data.name }}</h2>
      <img [src]="data.image_url" [alt]="data.name" class="villager-full-image">
      <div class="details-grid">
        <div class="detail-item">
          <mat-icon>cake</mat-icon>
          <span>Birthday: {{ data.birthday_month }} {{ data.birthday_day }}</span>
        </div>
        <div class="detail-item">
          <mat-icon>favorite</mat-icon>
          <span>Personality: {{ data.personality }}</span>
        </div>
        <div class="detail-item">
          <mat-icon>pets</mat-icon>
          <span>Species: {{ data.species }}</span>
        </div>
        <div class="detail-item">
          <mat-icon>person</mat-icon>
          <span>Gender: {{ data.gender }}</span>
        </div>
        <div class="detail-item">
          <mat-icon>home</mat-icon>
          <span>House Interior: {{ data.house_interior_url ? 'Available' : 'Not Available' }}</span>
        </div>
      </div>
      <div class="villager-phrases">
        <h3>Catchphrase</h3>
        <p>"{{ data.phrase }}"</p>
        <h3>Coffee Preferences</h3>
        <p>{{ data.coffee_preference || 'Unknown' }}</p>
      </div>
      <div class="game-appearances">
        <h3>Game Appearances</h3>
        <div class="game-chips">
          <div *ngFor="let game of data.appearances" 
               class="game-chip"
               [matTooltip]="getGameName(game)"
               matTooltipPosition="above"
               (dblclick)="copyGameName($event, getGameName(game))">
            <span class="game-name">{{ getGameName(game) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .villager-details {
      padding: 20px;
      max-width: 600px;
    }
    .villager-full-image {
      width: 100%;
      max-width: 300px;
      margin: 20px auto;
      display: block;
    }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .detail-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .villager-phrases {
      margin: 20px 0;
      padding: 15px;
      background: rgba(130, 207, 156, 0.1);
      border-radius: 10px;
    }
    .game-appearances {
      margin-top: 20px;
    }
    .game-appearances h3 {
      margin-bottom: 10px;
    }
    .game-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .game-chip {
      background-color: var(--acnh-green);
      color: white;
      padding: 8px 16px;
      border-radius: 16px;
      max-width: 200px;
      transition: all 0.3s ease;
      cursor: pointer;
      user-select: none;
    }
    .game-chip:hover {
      background-color: var(--acnh-brown);
      transform: translateY(-2px);
    }
    .game-chip:active {
      transform: translateY(0);
    }
    .game-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @keyframes copyPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .copy-animation {
      animation: copyPulse 0.3s ease;
    }
  `]
})
export class VillagerDetailsComponent {
  private viewContainerRef = inject(ViewContainerRef);

  constructor(@Inject(MAT_DIALOG_DATA) public data: Villager) {}

  getGameName(code: string): string {
    return getFullGameName(code);
  }

  copyGameName(event: MouseEvent, gameName: string): void {
    event.stopPropagation();
    navigator.clipboard.writeText(gameName).then(() => {
      // Add pulse animation to the clicked chip
      const chip = (event.target as HTMLElement).closest('.game-chip');
      if (chip) {
        chip.classList.add('copy-animation');
        setTimeout(() => chip.classList.remove('copy-animation'), 300);
      }

      // Show notification
      const notificationRef = this.viewContainerRef.createComponent(CopyNotificationComponent);
      document.body.appendChild(notificationRef.location.nativeElement);
      notificationRef.instance.show(notificationRef.location.nativeElement);
    });
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="acnh-header">
      <img src="assets/acnh-logo.png" alt="Animal Crossing: New Horizons" class="acnh-logo">
      <mat-icon class="leaf-icon floating-leaf">eco</mat-icon>
    </div>

    <div class="container">
      <div class="search-container">
        <form [formGroup]="searchForm">
          <mat-form-field appearance="outline">
            <mat-label>
              <mat-icon class="leaf-icon">search</mat-icon>
              Search Villagers
            </mat-label>
            <input matInput formControlName="keyword" placeholder="Enter villager name...">
          </mat-form-field>
        </form>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <div class="grid-layout" *ngIf="!loading">
        <div *ngFor="let villager of filteredData" 
             class="villager-card" 
             (click)="showVillagerDetails(villager)">
          <img [src]="villager.image_url" [alt]="villager.name" class="villager-image">
          <div class="villager-info">
            <h3>{{ villager.name }}</h3>
            <p>
              <mat-icon class="leaf-icon">pets</mat-icon>
              {{ villager.species }}
            </p>
            <p>
              <mat-icon class="leaf-icon">cake</mat-icon>
              {{ villager.birthday_month }} {{ villager.birthday_day }}
            </p>
            <p>
              <mat-icon class="leaf-icon">psychology</mat-icon>
              {{ villager.personality }}
            </p>
            <p class="villager-quote">
              "{{ villager.phrase }}"
            </p>
          </div>
          <div class="game-appearances">
            <div class="game-chips">
              <div *ngFor="let game of villager.appearances | slice:0:3" 
                   class="game-chip"
                   [matTooltip]="getGameName(game)"
                   matTooltipPosition="above"
                   (dblclick)="copyGameName($event, getGameName(game))">
                <span class="game-name">{{ getGameName(game) }}</span>
              </div>
              <div *ngIf="villager.appearances.length > 3" 
                   class="game-chip"
                   [matTooltip]="getRemainingGames(villager.appearances)">
                +{{ villager.appearances.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      padding: 20px;
    }

    @media (max-width: 768px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  private viewContainerRef = inject(ViewContainerRef);

  searchForm: FormGroup;
  data: Villager[] = [];
  filteredData: Villager[] = [];
  loading = true;

  constructor(
    private apiService: ApiService, 
    private formBuilder: FormBuilder,
    private dialog: MatDialog
  ) {
    this.searchForm = this.formBuilder.group({
      keyword: ['']
    });
  }

  ngOnInit() {
    this.apiService.getVillagers().subscribe(
      (response: Villager[]) => {
        this.data = response;
        this.filteredData = response;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching villagers:', error);
        this.loading = false;
      }
    );

    this.searchForm.get('keyword')?.valueChanges.subscribe((value) => {
      this.searchData(value);
    });
  }

  getGameName(code: string): string {
    return getFullGameName(code);
  }

  getRemainingGames(appearances: string[]): string {
    return appearances.slice(3)
      .map(game => getFullGameName(game))
      .join('\n');
  }

  searchData(keyword: string) {
    this.filteredData = this.data.filter((villager) =>
      villager.name.toLowerCase().includes(keyword.toLowerCase()) ||
      villager.personality.toLowerCase().includes(keyword.toLowerCase()) ||
      villager.species.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  showVillagerDetails(villager: Villager) {
    this.apiService.getVillagerDetails(villager.name).subscribe(
      (details: Villager) => {
        this.dialog.open(VillagerDetailsComponent, {
          data: details,
          width: '600px',
          panelClass: 'villager-dialog'
        });
      }
    );
  }

  copyGameName(event: MouseEvent, gameName: string): void {
    event.stopPropagation();
    navigator.clipboard.writeText(gameName).then(() => {
      // Add pulse animation to the clicked chip
      const chip = (event.target as HTMLElement).closest('.game-chip');
      if (chip) {
        chip.classList.add('copy-animation');
        setTimeout(() => chip.classList.remove('copy-animation'), 300);
      }

      // Show notification
      const notificationRef = this.viewContainerRef.createComponent(CopyNotificationComponent);
      document.body.appendChild(notificationRef.location.nativeElement);
      notificationRef.instance.show(notificationRef.location.nativeElement);
    });
  }
}
