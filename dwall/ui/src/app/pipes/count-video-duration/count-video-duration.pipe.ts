import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countVideoDuration'
})

export class CountVideoDurationPipe implements PipeTransform {
  transform(value: any): any {
    if (!value) return '';
    let minutes = Math.floor(value / 60);
    let seconds: string = Math.round(value - minutes * 60).toString();
    if (seconds.toString().length === 1) {
      seconds = '0' + seconds;
    }
    return `${minutes}:${seconds}`;
  }
}
