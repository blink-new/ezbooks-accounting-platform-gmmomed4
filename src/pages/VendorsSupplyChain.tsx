import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@blinkdotnew/sdk';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Package, 
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Factory,
  Warehouse,
  Truck,
  BarChart3
} from 'lucide-react';

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
});

interface Vendor {
  id: string;
  userId: string;
  vendorName: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit: number;
  currency: string;
  category?: string;
  tags?: string;
  notes?: string;
  status: string;
  rating: number;
  createdAt: string;
  updatedAt?: string;
}

interface SupplyChainLocation {
  id: string;
  userId: string;
  vendorId?: string;
  locationName: string;
  locationType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  capacity?: string;
  operatingHours?: string;
  certifications?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

interface VendorProduct {
  id: string;
  userId: string;
  vendorId: string;
  productName: string;
  productCode?: string;
  category?: string;
  description?: string;
  unitPrice?: number;
  currency: string;
  minimumOrderQuantity: number;
  leadTime?: string;
  availability: string;
  specifications?: string;
  certifications?: string;
  createdAt: string;
  updatedAt?: string;
}

const VendorsSupplyChain: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<SupplyChainLocation[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('vendors');

  const [vendorForm, setVendorForm] = useState({
    vendorName: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    taxId: '',
    paymentTerms: '',
    creditLimit: 0,
    currency: 'USD',
    category: '',
    tags: '',
    notes: '',
    status: 'active',
    rating: 0
  });

  const [locationForm, setLocationForm] = useState({
    vendorId: '',
    locationName: '',
    locationType: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    capacity: '',
    operatingHours: '',
    certifications: '',
    notes: '',
    isActive: true
  });

  const [productForm, setProductForm] = useState({
    vendorId: '',
    productName: '',
    productCode: '',
    category: '',
    description: '',
    unitPrice: 0,
    currency: 'USD',
    minimumOrderQuantity: 1,
    leadTime: '',
    availability: 'available',
    specifications: '',
    certifications: ''
  });

  const loadData = async () => {
    try {
      if (!blink.auth.isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access vendor data.",
          variant: "destructive"
        });
        return;
      }

      const user = await blink.auth.me();
      
      // Load vendors
      const vendorsData = await blink.db.vendors.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      setVendors(vendorsData || []);

      // Load supply chain locations
      const locationsData = await blink.db['supply_chain_locations'].list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      setLocations(locationsData || []);

      // Load vendor products
      const productsData = await blink.db['vendor_products'].list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      setProducts(productsData || []);

    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load vendor and supply chain data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVendor = async () => {
    try {
      if (!blink.auth.isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add vendors.",
          variant: "destructive"
        });
        return;
      }

      if (!vendorForm.vendorName.trim()) {
        toast({
          title: "Validation Error",
          description: "Vendor name is required.",
          variant: "destructive"
        });
        return;
      }

      const user = await blink.auth.me();
      const vendorId = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const vendorData = {
        id: vendorId,
        userId: user.id,
        ...vendorForm,
        creditLimit: Number(vendorForm.creditLimit) || 0,
        rating: Number(vendorForm.rating) || 0
      };

      await blink.db.vendors.create(vendorData);

      toast({
        title: "Success!",
        description: "Vendor added successfully.",
      });

      setIsAddVendorOpen(false);
      setVendorForm({
        vendorName: '',
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        taxId: '',
        paymentTerms: '',
        creditLimit: 0,
        currency: 'USD',
        category: '',
        tags: '',
        notes: '',
        status: 'active',
        rating: 0
      });
      
      loadData();
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Error",
        description: "Failed to add vendor. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddLocation = async () => {
    try {
      if (!blink.auth.isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add locations.",
          variant: "destructive"
        });
        return;
      }

      if (!locationForm.locationName.trim()) {
        toast({
          title: "Validation Error",
          description: "Location name is required.",
          variant: "destructive"
        });
        return;
      }

      const user = await blink.auth.me();
      const locationId = `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const locationData = {
        id: locationId,
        userId: user.id,
        ...locationForm,
        isActive: locationForm.isActive ? 1 : 0
      };

      await blink.db['supply_chain_locations'].create(locationData);

      toast({
        title: "Success!",
        description: "Supply chain location added successfully.",
      });

      setIsAddLocationOpen(false);
      setLocationForm({
        vendorId: '',
        locationName: '',
        locationType: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        contactPerson: '',
        phone: '',
        email: '',
        capacity: '',
        operatingHours: '',
        certifications: '',
        notes: '',
        isActive: true
      });
      
      loadData();
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!blink.auth.isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add products.",
          variant: "destructive"
        });
        return;
      }

      if (!productForm.productName.trim() || !productForm.vendorId) {
        toast({
          title: "Validation Error",
          description: "Product name and vendor are required.",
          variant: "destructive"
        });
        return;
      }

      const user = await blink.auth.me();
      const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const productData = {
        id: productId,
        userId: user.id,
        ...productForm,
        unitPrice: Number(productForm.unitPrice) || 0,
        minimumOrderQuantity: Number(productForm.minimumOrderQuantity) || 1
      };

      await blink.db['vendor_products'].create(productData);

      toast({
        title: "Success!",
        description: "Vendor product added successfully.",
      });

      setIsAddProductOpen(false);
      setProductForm({
        vendorId: '',
        productName: '',
        productCode: '',
        category: '',
        description: '',
        unitPrice: 0,
        currency: 'USD',
        minimumOrderQuantity: 1,
        leadTime: '',
        availability: 'available',
        specifications: '',
        certifications: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(vendors.map(v => v.category).filter(Boolean))];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors & Supply Chain</h1>
          <p className="text-gray-600 mt-1">Manage your global vendor network and supply chain operations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>
                  Add a new vendor to your global database
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    value={vendorForm.vendorName}
                    onChange={(e) => setVendorForm({...vendorForm, vendorName: e.target.value})}
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={vendorForm.companyName}
                    onChange={(e) => setVendorForm({...vendorForm, companyName: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({...vendorForm, contactPerson: e.target.value})}
                    placeholder="Enter contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={vendorForm.website}
                    onChange={(e) => setVendorForm({...vendorForm, website: e.target.value})}
                    placeholder="Enter website URL"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({...vendorForm, address: e.target.value})}
                    placeholder="Enter full address"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={vendorForm.city}
                    onChange={(e) => setVendorForm({...vendorForm, city: e.target.value})}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={vendorForm.state}
                    onChange={(e) => setVendorForm({...vendorForm, state: e.target.value})}
                    placeholder="Enter state/province"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={vendorForm.country}
                    onChange={(e) => setVendorForm({...vendorForm, country: e.target.value})}
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={vendorForm.postalCode}
                    onChange={(e) => setVendorForm({...vendorForm, postalCode: e.target.value})}
                    placeholder="Enter postal code"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({...vendorForm, category: e.target.value})}
                    placeholder="e.g., Manufacturing, Services"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({...vendorForm, paymentTerms: e.target.value})}
                    placeholder="e.g., Net 30, COD"
                  />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={vendorForm.creditLimit}
                    onChange={(e) => setVendorForm({...vendorForm, creditLimit: Number(e.target.value)})}
                    placeholder="Enter credit limit"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={vendorForm.currency} onValueChange={(value) => setVendorForm({...vendorForm, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Select value={vendorForm.rating.toString()} onValueChange={(value) => setVendorForm({...vendorForm, rating: Number(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Rating</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={vendorForm.notes}
                    onChange={(e) => setVendorForm({...vendorForm, notes: e.target.value})}
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddVendorOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVendor} className="bg-blue-600 hover:bg-blue-700">
                  Add Vendor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Supply Chain Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products/Services</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vendors.filter(v => v.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="locations">Supply Chain</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{vendor.vendorName}</CardTitle>
                      {vendor.companyName && (
                        <CardDescription>{vendor.companyName}</CardDescription>
                      )}
                    </div>
                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                      {vendor.status}
                    </Badge>
                  </div>
                  {vendor.rating > 0 && (
                    <div className="flex items-center gap-1">
                      {renderStars(vendor.rating)}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {vendor.contactPerson && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {vendor.contactPerson}
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {vendor.email}
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-2" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                  {vendor.city && vendor.country && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {vendor.city}, {vendor.country}
                    </div>
                  )}
                  {vendor.category && (
                    <Badge variant="outline" className="text-xs">
                      {vendor.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first vendor to the database.</p>
              <Button onClick={() => setIsAddVendorOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vendor
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Supply Chain Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Supply Chain Locations</h2>
            <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Supply Chain Location</DialogTitle>
                  <DialogDescription>
                    Add a new location to your supply chain network
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="locationName">Location Name *</Label>
                    <Input
                      id="locationName"
                      value={locationForm.locationName}
                      onChange={(e) => setLocationForm({...locationForm, locationName: e.target.value})}
                      placeholder="Enter location name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationType">Location Type</Label>
                    <Select value={locationForm.locationType} onValueChange={(value) => setLocationForm({...locationForm, locationType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="factory">Factory</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="distribution_center">Distribution Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vendorId">Associated Vendor</Label>
                    <Select value={locationForm.vendorId} onValueChange={(value) => setLocationForm({...locationForm, vendorId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No vendor</SelectItem>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>{vendor.vendorName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="locationContactPerson">Contact Person</Label>
                    <Input
                      id="locationContactPerson"
                      value={locationForm.contactPerson}
                      onChange={(e) => setLocationForm({...locationForm, contactPerson: e.target.value})}
                      placeholder="Enter contact person"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="locationAddress">Address</Label>
                    <Input
                      id="locationAddress"
                      value={locationForm.address}
                      onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                      placeholder="Enter full address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationCity">City</Label>
                    <Input
                      id="locationCity"
                      value={locationForm.city}
                      onChange={(e) => setLocationForm({...locationForm, city: e.target.value})}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationCountry">Country</Label>
                    <Input
                      id="locationCountry"
                      value={locationForm.country}
                      onChange={(e) => setLocationForm({...locationForm, country: e.target.value})}
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      value={locationForm.capacity}
                      onChange={(e) => setLocationForm({...locationForm, capacity: e.target.value})}
                      placeholder="e.g., 10,000 sq ft, 500 units"
                    />
                  </div>
                  <div>
                    <Label htmlFor="operatingHours">Operating Hours</Label>
                    <Input
                      id="operatingHours"
                      value={locationForm.operatingHours}
                      onChange={(e) => setLocationForm({...locationForm, operatingHours: e.target.value})}
                      placeholder="e.g., Mon-Fri 8AM-6PM"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAddLocationOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLocation} className="bg-green-600 hover:bg-green-700">
                    Add Location
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => {
              const associatedVendor = vendors.find(v => v.id === location.vendorId);
              return (
                <Card key={location.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{location.locationName}</CardTitle>
                        {location.locationType && (
                          <CardDescription className="capitalize">{location.locationType.replace('_', ' ')}</CardDescription>
                        )}
                      </div>
                      <Badge variant={Number(location.isActive) > 0 ? 'default' : 'secondary'}>
                        {Number(location.isActive) > 0 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {associatedVendor && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Building2 className="h-4 w-4 mr-2" />
                        {associatedVendor.vendorName}
                      </div>
                    )}
                    {location.city && location.country && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {location.city}, {location.country}
                      </div>
                    )}
                    {location.capacity && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Warehouse className="h-4 w-4 mr-2" />
                        {location.capacity}
                      </div>
                    )}
                    {location.operatingHours && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Factory className="h-4 w-4 mr-2" />
                        {location.operatingHours}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {locations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-600 mb-4">Add supply chain locations to track your network.</p>
              <Button onClick={() => setIsAddLocationOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Location
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Vendor Products & Services</h2>
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Vendor Product/Service</DialogTitle>
                  <DialogDescription>
                    Add a new product or service to your vendor catalog
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productVendorId">Vendor *</Label>
                    <Select value={productForm.vendorId} onValueChange={(value) => setProductForm({...productForm, vendorId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>{vendor.vendorName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="productName">Product/Service Name *</Label>
                    <Input
                      id="productName"
                      value={productForm.productName}
                      onChange={(e) => setProductForm({...productForm, productName: e.target.value})}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCode">Product Code</Label>
                    <Input
                      id="productCode"
                      value={productForm.productCode}
                      onChange={(e) => setProductForm({...productForm, productCode: e.target.value})}
                      placeholder="Enter product code/SKU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCategory">Category</Label>
                    <Input
                      id="productCategory"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      placeholder="Enter category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={productForm.unitPrice}
                      onChange={(e) => setProductForm({...productForm, unitPrice: Number(e.target.value)})}
                      placeholder="Enter unit price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCurrency">Currency</Label>
                    <Select value={productForm.currency} onValueChange={(value) => setProductForm({...productForm, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="minimumOrderQuantity">Minimum Order Quantity</Label>
                    <Input
                      id="minimumOrderQuantity"
                      type="number"
                      value={productForm.minimumOrderQuantity}
                      onChange={(e) => setProductForm({...productForm, minimumOrderQuantity: Number(e.target.value)})}
                      placeholder="Enter minimum order quantity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadTime">Lead Time</Label>
                    <Input
                      id="leadTime"
                      value={productForm.leadTime}
                      onChange={(e) => setProductForm({...productForm, leadTime: e.target.value})}
                      placeholder="e.g., 2-3 weeks"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="productDescription">Description</Label>
                    <Textarea
                      id="productDescription"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProduct} className="bg-purple-600 hover:bg-purple-700">
                    Add Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product/Service</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const vendor = vendors.find(v => v.id === product.vendorId);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          {product.productCode && (
                            <div className="text-sm text-gray-500">{product.productCode}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{vendor?.vendorName || 'Unknown'}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>
                        {product.unitPrice ? `${product.currency} ${product.unitPrice.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>{product.leadTime || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={product.availability === 'available' ? 'default' : 'secondary'}>
                          {product.availability}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Add products and services from your vendors.</p>
              <Button onClick={() => setIsAddProductOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorsSupplyChain;