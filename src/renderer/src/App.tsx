import { Component } from 'solid-js';
import { HashRouter, Route } from '@solidjs/router';
import { LayoutWithNavigation } from './components/layout';
import { Dashboard, Settings, Personas, Conversations, Reviews } from './pages';

const App: Component = () => {
  return (
    <HashRouter root={LayoutWithNavigation}>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/personas" component={Personas} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/reviews" component={Reviews} />
    </HashRouter>
  );
};

export default App;
