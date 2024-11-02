import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { villagers } from 'animal-crossing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ApiService } from './api.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, 
    ReactiveFormsModule, 
    CommonModule, 
    HttpClientModule, 
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
  ],
  // providers: [provideHttpClient()],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
  
})
export class AppComponent implements OnInit{
  // title = 'acnh';
  // testacnh(){
  //   const freya = villagers.find(villager => villager.name === 'Freya');
  //   return freya?.birthday;
  // }

   searchForm: FormGroup;
  // searchResults: string[] = [];

  // constructor(private formBuilder: FormBuilder) {
  //   this.searchForm = this.formBuilder.group({
  //     searchTerm: ['']  // Input tìm kiếm
  //   });
  // }

  // onSearch(): void {
  //   const searchTerm = this.searchForm.get('searchTerm')?.value;
  //   this.searchResults = this.mockSearch(searchTerm);
  // }
  // mockSearch(searchTerm: string): string[] {
  //   const villagerbirthday = villagers.filter(villager => villager.birthday.toLowerCase().includes(searchTerm.toLowerCase())).map(villager => villager.birthday);
  //   return villagerbirthday;
    
  // }
  data: any[] = [];
  filteredData: any[] = [];
  displayedColumns: string[] = ['name','name', 'species', 'gender', 'personality', 'birthday'];

  constructor(private apiService: ApiService, private formBuilder: FormBuilder) {
       this.searchForm = this.formBuilder.group({
      keyword: ['']  // Input tìm kiếm
    });
  }

  ngOnInit() {
    this.apiService.getVillagers().subscribe(
      (response) => {
        this.data = response;
        this.filteredData = response;
      },
      (error) => {
        console.error('Lỗi khi gọi API:', error);
      }
    );

    this.searchForm.get('keyword')?.valueChanges.subscribe((value) => {
      this.searchData(value);
    });


}  

searchData(keyword: string) {
  this.filteredData = this.data.filter((data) =>
    data.name.toLowerCase().includes(keyword.toLowerCase()) &&
  data.appearances.includes("NH")
  );
}

}
