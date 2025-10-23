import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],            // ⬅️ on enlève NavigationComponent ici
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {}
