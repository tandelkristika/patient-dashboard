const { pickPatientFields } = require('../src/utils/pickPatientFields');

describe('pickPatientFields (blocks mass assignment)', () => {
  test('keeps the allowed patient fields', () => {
    const input = {
      name: 'Jane',
      age: 40,
      gender: 'Female',
      bloodGroup: 'O+',
      phone: '+91 98765 43210',
      email: 'jane@example.com',
      medicalHistory: { conditions: [] },
    };
    expect(pickPatientFields(input)).toEqual(input);
  });

  test('drops the doctor field so ownership cannot be changed', () => {
    const result = pickPatientFields({ name: 'Jane', doctor: '507f1f77bcf86cd799439011' });
    expect(result).toEqual({ name: 'Jane' });
    expect(result).not.toHaveProperty('doctor');
  });

  test('drops system and unknown fields', () => {
    const result = pickPatientFields({
      _id: 'x',
      createdAt: 'x',
      updatedAt: 'x',
      __v: 1,
      isAdmin: true,
      name: 'Jane',
    });
    expect(Object.keys(result)).toEqual(['name']);
  });

  test('ignores undefined values but keeps empty strings (so a field can be cleared)', () => {
    expect(pickPatientFields({ name: 'Jane', phone: '', email: undefined })).toEqual({
      name: 'Jane',
      phone: '',
    });
  });

  test('handles missing or invalid input safely', () => {
    expect(pickPatientFields(undefined)).toEqual({});
    expect(pickPatientFields(null)).toEqual({});
    expect(pickPatientFields('text')).toEqual({});
  });
});