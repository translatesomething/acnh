import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { villagers } from 'animal-crossing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
  
})
export class AppComponent {
  title = 'acnh';
  testacnh(){
    const freya = villagers.find(villager => villager.name === 'Freya');
    return freya?.birthday;
  }

  searchForm: FormGroup;
  searchResults: string[] = [];

  constructor(private formBuilder: FormBuilder) {
    this.searchForm = this.formBuilder.group({
      searchTerm: ['']  // Input tìm kiếm
    });
  }

  onSearch(): void {
    const searchTerm = this.searchForm.get('searchTerm')?.value;
    this.searchResults = this.mockSearch(searchTerm);
  }
  mockSearch(searchTerm: string): string[] {
    const villagerbirthday = villagers.filter(villager => villager.name.toLowerCase().includes(searchTerm.toLowerCase())).map(villager => villager.name);
    return villagerbirthday;
    
  }
  

}
