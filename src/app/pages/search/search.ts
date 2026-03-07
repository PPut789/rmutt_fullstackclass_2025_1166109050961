import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class SearchComponent implements OnInit {
  searchQuery = '';
  results: any = { products: [], suppliers: [], orders: [], shipments: [] };
  isLoading = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    // คอยดักฟังว่า URL ตรง ?q= เปลี่ยนไปไหม (เวลากดค้นหาซ้ำ)
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      if (this.searchQuery) {
        this.fetchResults();
      }
    });
  }

  fetchResults() {
    this.isLoading = true;
    this.http.get(`http://localhost:3000/search?q=${this.searchQuery}`).subscribe((res: any) => {
      this.results = res;
      this.isLoading = false;
    });
  }
}