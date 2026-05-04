import { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { LayoutWithNavigation } from './components/layout';
import { Dashboard, Settings, Personas, Conversations, Reviews } from './pages';

const App: Component = () => {
  return (
    <Router root={LayoutWithNavigation}>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/personas" component={Personas} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/reviews" component={Reviews} />
    </Router>
  );
};

export default App;
