// Only these fields may be written from a request body.
// Everything else (doctor, _id, createdAt, ...) is ignored, so a client can
// never change who owns a patient or overwrite system fields.
const ALLOWED_PATIENT_FIELDS = [
  'name',
  'age',
  'gender',
  'bloodGroup',
  'phone',
  'email',
  'medicalHistory',
];

const pickPatientFields = (data) => {
  const source = data && typeof data === 'object' ? data : {};
  const picked = {};

  ALLOWED_PATIENT_FIELDS.forEach((field) => {
    if (
      Object.prototype.hasOwnProperty.call(source, field) &&
      source[field] !== undefined
    ) {
      picked[field] = source[field];
    }
  });

  return picked;
};

module.exports = { ALLOWED_PATIENT_FIELDS, pickPatientFields };