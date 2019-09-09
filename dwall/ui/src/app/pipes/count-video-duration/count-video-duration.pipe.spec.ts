import { CountVideoDurationPipe } from './count-video-duration.pipe';

describe('CountVideoDurationPipe', () => {
  it('create an instance', () => {
    const pipe = new CountVideoDurationPipe();
    expect(pipe).toBeTruthy();
  });
  it('35 sec', () => {
    const pipe = new CountVideoDurationPipe();
    expect(pipe.transform('35')).toBe('0:35');
  });
  it('nothing passed', () => {
    const pipe = new CountVideoDurationPipe();
    expect(pipe.transform('')).toBe('');
  });
  it('0 passed', () => {
    const pipe = new CountVideoDurationPipe();
    expect(pipe.transform('0')).toBe('0:00');
  });
  it('60 passed', () => {
    const pipe = new CountVideoDurationPipe();
    expect(pipe.transform('60')).toBe('1:00');
  });
  it('150 passed', () => {
    const pipe = new CountVideoDurationPipe();
    expect(pipe.transform('150')).toBe('2:30');
  });
});
