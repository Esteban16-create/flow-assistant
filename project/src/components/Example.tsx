import { Smile } from 'lucide-react';
import Button from './ui/Button';

export default function Example() {
  return (
    <div className="space-y-4">
      {/* Primary button */}
      <Button>
        Click me
      </Button>

      {/* Ghost button with icon */}
      <Button variant="ghost">
        <Smile className="w-5 h-5 text-green-500 mr-2" />
        Super
      </Button>

      {/* Secondary button */}
      <Button variant="secondary" size="sm">
        Small button
      </Button>

      {/* Danger button */}
      <Button variant="danger" size="lg">
        Delete
      </Button>
    </div>
  );
}