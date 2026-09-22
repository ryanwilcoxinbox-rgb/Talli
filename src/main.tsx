import { render } from 'preact';
import { App } from './app';
import { state } from './store';
import { activeKidId, route } from './router';
import './styles.css';

// Reopening the app mid-play goes straight back to the timer.
if (state.value.session && route.value !== 'play') location.hash = '/play';
else if (!location.hash) location.hash = activeKidId.value ? '/home' : '/us';

render(<App />, document.getElementById('app')!);
