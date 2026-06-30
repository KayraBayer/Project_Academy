import { useParams } from 'react-router-dom';
import AdminResources from './AdminResources';

export default function AdminCategoryResources() {
  const { category, publisher } = useParams();
  return <AdminResources forcedCategory={category} selectedPublisher={publisher || ''} />;
}
