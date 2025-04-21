import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'buffer-name1',
  templateUrl: './buffer-name-1.component.html',
  styleUrls: ['./buffer-name-1.component.css'],
})
export class BufferName1 implements OnInit {
  showOverlay = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Hide the overlay after 4 seconds
    setTimeout(() => {
      this.showOverlay = false;
      this.router.navigate(['/candidate-assessment']);
    }, 4000); // 4000 milliseconds = 4 seconds
  }
}