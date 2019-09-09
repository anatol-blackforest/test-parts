import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sizeCount'
})

export class SizeCountPipe implements PipeTransform {
  transform(value: number, decimals: number): string {
    if (value <= 0 || !value) return '0 Byte';
    let k = 1024;
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = Math.floor(Math.log(value) / Math.log(k));
    return `${parseFloat((value / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }
}
