import { Link } from 'react-router-dom';
import { Empty, Glass } from '../components/ui';

export default function NotFound() {
  return (
    <div className="stack">
      <h1>Page not found</h1>
      <Glass className="pad">
        <Empty icon="∅" title="This page does not exist">
          <Link className="btn" to="/">
            Back to the dashboard
          </Link>
        </Empty>
      </Glass>
    </div>
  );
}
