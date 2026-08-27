import {
  LightbulbOff,
  Compass,
  VideoOff,
  PawPrint,
  AlertTriangle,
  Footprints,
  HelpCircle,
  MessageSquareWarning,
  Eye,
  ShieldAlert,
  Bus,
  AlertOctagon,
} from 'lucide-react';

const iconMap = {
  LightbulbOff,
  Compass,
  VideoOff,
  PawPrint,
  AlertTriangle,
  Footprints,
  HelpCircle,
  MessageSquareWarning,
  Eye,
  ShieldAlert,
  Bus,
  AlertOctagon,
};

export function CategoryIcon({ name, size = 18, className = '' }) {
  const IconComponent = iconMap[name] || AlertTriangle;
  return <IconComponent size={size} className={className} />;
}
