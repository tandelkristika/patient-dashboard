const Doctor = require('../src/models/Doctor');

const validData = async () => ({
  name: 'Dr. Test',
  email: 'Test@Example.COM ',
  passwordHash: await Doctor.hashPassword('CorrectHorse9'),
  specialization: 'Cardiology',
});

describe('Doctor model', () => {
  test('a valid doctor passes validation', async () => {
    const doctor = new Doctor(await validData());
    await expect(doctor.validate()).resolves.toBeUndefined();
  });

  test('email is lowercased and trimmed', async () => {
    const doctor = new Doctor(await validData());
    expect(doctor.email).toBe('test@example.com');
  });

  test('required fields are enforced', async () => {
    const doctor = new Doctor({});
    const err = await doctor.validate().catch((e) => e);

    expect(Object.keys(err.errors)).toEqual(
      expect.arrayContaining([
        'name',
        'email',
        'passwordHash',
        'specialization',
      ])
    );
  });

  test('invalid email is rejected', async () => {
    const doctor = new Doctor({
      ...(await validData()),
      email: 'not-an-email',
    });

    const err = await doctor.validate().catch((e) => e);

    expect(err.errors.email).toBeDefined();
  });

  test('the password is stored only as a hash', async () => {
    const hash = await Doctor.hashPassword('CorrectHorse9');

    expect(hash).not.toContain('CorrectHorse9');
    expect(hash.startsWith('$2')).toBe(true);
  });

  test('same password gives different hashes (random salt)', async () => {
    const a = await Doctor.hashPassword('CorrectHorse9');
    const b = await Doctor.hashPassword('CorrectHorse9');

    expect(a).not.toBe(b);
  });

  test('comparePassword accepts the right password and rejects the wrong one', async () => {
    const doctor = new Doctor(await validData());

    expect(await doctor.comparePassword('CorrectHorse9')).toBe(true);
    expect(await doctor.comparePassword('WrongPassword1')).toBe(false);
  });

  test('comparePassword is false when the hash was not loaded', async () => {
    const doctor = new Doctor({ name: 'No Hash' });

    expect(await doctor.comparePassword('anything')).toBe(false);
  });

  test('passwordHash never appears in JSON output', async () => {
    const doctor = new Doctor(await validData());

    const json = JSON.parse(JSON.stringify(doctor));

    expect(json.passwordHash).toBeUndefined();
    expect(json.email).toBe('test@example.com');
  });

  test('passwordHash is hidden from queries by default', () => {
    expect(Doctor.schema.path('passwordHash').options.select).toBe(false);
  });
});
