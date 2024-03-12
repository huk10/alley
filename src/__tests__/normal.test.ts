import {describe, it, expect} from '@jest/globals';
import { normalize, NormalOptions } from '../normalize';

describe('normal', () => {
  it('default options', () => {
    expect(normalize('/api/v1/USER/')).toEqual('/api/v1/user');
    expect(normalize('api/v1/USER/')).toEqual('/api/v1/user');
    expect(normalize('/api/v1/USER/////')).toEqual('/api/v1/user');
    expect(normalize('//////api//////v1//////USER/////')).toEqual('/api/v1/user');
  });

  it('parameter coverage', () => {
    const opt: NormalOptions = {caseSensitive: true, ignoreDuplicateSlashes: false, ignoreTrailingSlash: false};
    expect(normalize('/api/v1/USER/', opt)).toEqual('/api/v1/USER/');
    expect(normalize('api/v1////', opt)).toEqual('/api/v1////');
    expect(normalize('api/////v1////', opt)).toEqual('/api/////v1////');
  })
});
