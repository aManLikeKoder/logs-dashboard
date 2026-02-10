# **App Name**: DataLens Pro

## Core Features:

- Data Source Display: Displays data from configured data sources, with fields for username, password, and timestamp, adapting to mobile-first design principles.
- Add/Edit Data Source: Enables adding new data sources, including Firebase configuration, collection path, and field mappings, with standardization to avoid misconfiguration. Functionality for managing Firebase credentials and security.
- Dynamic PIN Display: Conditionally displays a PIN field if the 'displayPin' option is enabled for a given data source.
- Real-time Data Refresh: Automatically refreshes data displayed from the selected data source periodically, with visual cues (spinner or progress bar) during the refresh.
- Manual Data Refresh: Provides a manual refresh button to update the displayed data from a selected data source.
- Paginated Data Loading: Implements pagination for efficient loading and display of large datasets from data sources.
- Data Search: Offers a search bar for filtering data by username, password, or timestamp across loaded data sets from data sources.

## Style Guidelines:

- Primary color: Deep midnight blue (#2c3e50) for a professional and focused feel.
- Background color: Dark slate gray (#34495e) with low saturation for comfortable readability.
- Accent color: Subtle sky blue (#3498db) to highlight key interactive elements.
- Body and headline font: 'Inter' sans-serif for a modern, machined, objective feel; readable in the long blocks of text expected in a data table.
- Use minimalist line icons for data actions and navigation, ensuring clarity and ease of use.
- Mobile-first responsive design for data tables, adapting to different screen sizes, ensuring readability on all devices.
- Subtle transitions for data updates, pagination, and modal appearances, improving user experience.