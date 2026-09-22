import { state, kidById } from './store';
import { activeKidId, route } from './router';
import { Nav, Toast } from './components/Chrome';
import { Us } from './screens/Us';
import { LittleHome } from './screens/LittleHome';
import { BigHome } from './screens/BigHome';
import { Play } from './screens/Play';
import { Family } from './screens/Family';
import { Parent } from './screens/Parent';
import { Setup } from './screens/Setup';

export function App() {
  const r = route.value;
  const kid = kidById(state.value, activeKidId.value);

  if (!state.value.setupComplete) {
    return (
      <div class="app">
        <Setup />
        <Toast />
      </div>
    );
  }

  let screen;
  switch (r) {
    case 'home':
      screen = !kid ? <Us /> : kid.mode === 'little' ? <LittleHome kid={kid} /> : <BigHome kid={kid} />;
      break;
    case 'family':
      screen = <Family />;
      break;
    case 'play':
      screen = <Play />;
      break;
    case 'parent':
      screen = <Parent />;
      break;
    default:
      screen = <Us />;
  }

  return (
    <div class="app">
      {screen}
      {r !== 'play' && <Nav />}
      <Toast />
    </div>
  );
}
