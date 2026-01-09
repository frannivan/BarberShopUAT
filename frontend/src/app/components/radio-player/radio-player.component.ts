import { Component, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-radio-player',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './radio-player.component.html',
    styleUrls: ['./radio-player.component.css']
})
export class RadioPlayerComponent implements OnDestroy {
    @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;

    // Default to Ibiza Global Radio (Standard SSL)
    streamUrl = 'https://listenssl.ibizaglobalradio.com:8024/ibizaglobalradio.mp3';
    isPlaying = false;
    volume = 0.5;

    togglePlay() {
        console.log('Toggling play...');
        const player = this.audioPlayerRef.nativeElement;

        if (this.isPlaying) {
            player.pause();
            this.isPlaying = false;
            console.log('Paused.');
        } else {
            console.log('Attempting to play:', this.streamUrl);
            player.volume = this.volume;
            player.play().then(() => {
                this.isPlaying = true;
                console.log('Playing!');
            }).catch(err => {
                console.error('Radio playback failed:', err);
                alert('No se pudo reproducir la radio. Verifica tu conexión o intenta otra URL.');
            });
        }
    }

    ngOnDestroy() {
        if (this.audioPlayerRef && this.isPlaying) {
            this.audioPlayerRef.nativeElement.pause();
        }
    }
}
