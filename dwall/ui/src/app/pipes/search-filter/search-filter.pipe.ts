import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchfilter'
})

@Injectable()
export class SearchFilterPipe implements PipeTransform {
  transform(items: any[], field: string|Array<string>, value: string): any[] {
    if (!items) return [];

    if (typeof field === 'string') {
      return items.filter(it => {
        it[field] = it[field] ? it[field] : '';
        return it[field].toLowerCase().indexOf(value.toLowerCase()) !== -1;
      });
    } else {
      return items.filter((it) => {
        return field.some((el) => {
          it[el] = it[el] ? it[el] : '';
          return it[el].toLowerCase().indexOf(value.toLowerCase()) !== -1;
        });
      });
    }
  }
}
