import {
  getDeviceClass,
  usesDrawer,
  getTableMode,
  drawerReducer,
  initialDrawerState,
} from '../src/utils/responsive.js';

let passed = 0;
let total = 0;

const check = (name, condition) => {
  total += 1;

  if (condition) {
    passed += 1;
  }

  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}`);
};

check(
  '375px is mobile',
  getDeviceClass(375) === 'mobile'
);

check(
  '767px is mobile',
  getDeviceClass(767) === 'mobile'
);

check(
  '768px is tablet',
  getDeviceClass(768) === 'tablet'
);

check(
  '1023px is tablet',
  getDeviceClass(1023) === 'tablet'
);

check(
  '1024px is laptop',
  getDeviceClass(1024) === 'laptop'
);

check(
  '1279px is laptop',
  getDeviceClass(1279) === 'laptop'
);

check(
  '1280px is desktop',
  getDeviceClass(1280) === 'desktop'
);

check(
  'invalid width falls back to mobile',
  getDeviceClass(NaN) === 'mobile' &&
    getDeviceClass(undefined) === 'mobile'
);

check(
  'drawer used on mobile and tablet',
  usesDrawer(767) && usesDrawer(1023)
);

check(
  'fixed sidebar from 1024px',
  !usesDrawer(1024)
);

check(
  'cards below 768px',
  getTableMode(767) === 'cards'
);

check(
  'table from 768px',
  getTableMode(768) === 'table'
);

let state = drawerReducer(
  initialDrawerState,
  { type: 'TOGGLE' }
);

check(
  'toggle opens the drawer',
  state.open === true
);

check(
  'toggle again closes it',
  drawerReducer(state, { type: 'TOGGLE' }).open === false
);

check(
  'Escape closes it',
  drawerReducer(state, { type: 'ESCAPE' }).open === false
);

check(
  'navigating closes it',
  drawerReducer(state, { type: 'ROUTE_CHANGE' }).open === false
);

check(
  'resizing to a wide screen closes it',
  drawerReducer(
    state,
    {
      type: 'RESIZE',
      width: 1280,
    }
  ).open === false
);

check(
  'resizing within tablet keeps it open',
  drawerReducer(
    state,
    {
      type: 'RESIZE',
      width: 800,
    }
  ).open === true
);

check(
  'unknown action changes nothing',
  drawerReducer(
    state,
    { type: 'NOPE' }
  ) === state
);

check(
  'opening an open drawer returns the same state',
  drawerReducer(
    state,
    { type: 'OPEN' }
  ) === state
);

console.log(`\n${passed}/${total} checks passed`);
