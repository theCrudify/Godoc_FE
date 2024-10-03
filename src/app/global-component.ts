import { environment } from 'src/environments/environment';
export const GlobalComponent = {
    // Api Calling
    API_URL : 'https://api-node.themesbrand.website/',
    headerToken : {'Authorization': `Bearer ${localStorage.getItem('token')}`},

    // Auth Api
    AUTH_API: environment.apiUrl,

    // Products Api
    product:'apps/product',
    productDelete:'apps/product/',

    // Orders Api
    order:'apps/order',
    orderId:'apps/order/',

    // Customers Api
    customer:'apps/customer',
   
}