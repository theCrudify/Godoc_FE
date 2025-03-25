export function revenueChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-primary", "--vz-success", "--vz-danger"]',
        'minimal': '["--vz-light", "--vz-primary", "--vz-info"]',
        'saas': '["--vz-success", "--vz-info", "--vz-danger"]',
        'modern': '["--vz-warning", "--vz-primary", "--vz-success"]',
        'interactive': '["--vz-info", "--vz-primary", "--vz-danger"]',
        'creative': '["--vz-warning", "--vz-primary", "--vz-danger"]',
        'corporate': '["--vz-light", "--vz-primary", "--vz-secondary"]',
        'galaxy': '["--vz-secondary", "--vz-primary", "--vz-primary-rgb, 0.50"]',
        'classic': '["--vz-light", "--vz-primary", "--vz-secondary"]',
        'vintage': '["--vz-success", "--vz-primary", "--vz-secondary"]'
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-success", "--vz-danger"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

export function marketChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-success", "--vz-danger"]',
        'minimal': '["--vz-success-rgb, 0.75", "--vz-danger-rgb, 0.75"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-success", "--vz-danger"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};


// Analaytic
export function countries_charts(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-info", "--vz-info", "--vz-info", "--vz-info", "--vz-danger", "--vz-info", "--vz-info", "--vz-info", "--vz-info", "--vz-info"]',
        'minimal': '["--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary-rgb, 0.45", "--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary"]',
        'material': '["--vz-primary", "--vz-primary", "--vz-info", "--vz-info", "--vz-danger", "--vz-primary", "--vz-primary", "--vz-warning", "--vz-primary", "--vz-primary"]',
        'galaxy': '["--vz-primary-rgb, 0.4", "--vz-primary-rgb, 0.4", "--vz-primary-rgb, 0.4", "--vz-primary-rgb, 0.4", "--vz-primary", "--vz-primary-rgb, 0.4", "--vz-primary-rgb, 0.4", "--vz-primary-rgb, 0.4", "--vz-primary-rgb, 0.4", "--vz-primary-rgb, 0.4"]',
        'classic': '["--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary-rgb, 0.45", "--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary", "--vz-primary"]'
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-info", "--vz-info", "--vz-info", "--vz-info", "--vz-danger", "--vz-info", "--vz-info", "--vz-info", "--vz-info", "--vz-info"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

export function AudiencesMetrics(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-success", "--vz-light"]',
        'minimal': '["--vz-primary", "--vz-light"]',
        'modern': '["--vz-primary", "--vz-light"]',
        'interactive': '["--vz-primary", "--vz-light"]',
        'creative': '["--vz-secondary", "--vz-light"]',
        'corporate': '["--vz-primary", "--vz-light"]',
        'galaxy': '["--vz-primary", "--vz-light"]',
        'classic': '["--vz-primary", "--vz-secondary"]',
        'vintage': '["--vz-primary", "--vz-success-rgb, 0.5"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-success", "--vz-light"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};
export function basicHeatmapChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-success", "--vz-info"]',
        'minimal': '["--vz-info", "--vz-primary"]',
        'modern': '["--vz-success", "--vz-secondary"]',
        'interactive': '["--vz-info", "--vz-primary"]',
        'creative': '["--vz-primary", "--vz-success"]',
        'corporate': '["--vz-secondary", "--vz-primary"]',
        'galaxy': '["--vz-primary", "--vz-secondary"]',
        'classic': '["--vz-primary", "--vz-danger"]',
        'vintage': '["--vz-success", "--vz-secondary"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-success", "--vz-info"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};
export function simpleDonutChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-primary", "--vz-warning", "--vz-info"]',
        'minimal': '["--vz-primary", "--vz-primary-rgb, 0.60", "--vz-primary-rgb, 0.75"]',
        'galaxy': '["--vz-primary", "--vz-primary-rgb, .75", "--vz-primary-rgb, 0.60"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-success", "--vz-info"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// dashboard crm
export function salesForecastChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-primary", "--vz-success", "--vz-warning"]',
        'minimal': '["--vz-primary-rgb, 0.75", "--vz-primary", "--vz-primary-rgb, 0.55"]',
        'creative': '["--vz-primary", "--vz-secondary", "--vz-info"]',
        'corporate': '["--vz-primary", "--vz-success", "--vz-secondary"]',
        'galaxy': '["--vz-primary", "--vz-secondary", "--vz-info"]',
        'classic': '["--vz-primary", "--vz-warning", "--vz-secondary"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-success", "--vz-warning"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

export function DealTypeChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-warning", "--vz-danger", "--vz-success"]',
        'minimal': '["--vz-primary-rgb, 0.15", "--vz-primary-rgb, 0.35", "--vz-primary-rgb, 0.45"]',
        'modern': '["--vz-warning", "--vz-secondary", "--vz-success"]',
        'interactive': '["--vz-warning", "--vz-info", "--vz-primary"]',
        'corporate': '["--vz-secondary", "--vz-info", "--vz-success"]',
        'classic': '["--vz-secondary", "--vz-danger", "--vz-success"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-warning", "--vz-danger", "--vz-success"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

export function splineAreaChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-success", "--vz-danger"]',
        'minimal': '["--vz-primary", "--vz-info"]',
        'interactive': '["--vz-info", "--vz-primary"]',
        'classic': '["--vz-primary", "--vz-secondary"]',
        'galaxy': '["--vz-primary", "--vz-secondary"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-success", "--vz-danger"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// ecommerce dashboard
export function SalesCategoryChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-primary", "--vz-success", "--vz-warning", "--vz-danger", "--vz-info"]',
        'minimal': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.70", "--vz-primary-rgb, 0.60", "--vz-primary-rgb, 0.45"]',
        'interactive': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.70", "--vz-primary-rgb, 0.60", "--vz-primary-rgb, 0.45"]',
        'galaxy': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.70", "--vz-primary-rgb, 0.60", "--vz-primary-rgb, 0.45"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-success", "--vz-warning", "--vz-danger", "--vz-info"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// dashboard crypto
export function Portfolio(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-primary", "--vz-info", "--vz-warning", "--vz-success"]',
        'minimal': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.65", "--vz-primary-rgb, 0.50"]',
        'interactive': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.65", "--vz-primary-rgb, 0.50"]',
        'galaxy': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.65", "--vz-primary-rgb, 0.50"]',
        'corporate': '["--vz-primary", "--vz-secondary", "--vz-info", "--vz-success"]',

    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-success", "--vz-warning", "--vz-danger", "--vz-info"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// project crypto
export function OverviewChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-primary", "--vz-warning", "--vz-success"]',
        'minimal': '["--vz-primary", "--vz-primary-rgb, 0.1", "--vz-primary-rgb, 0.50"]',
        'interactive': '["--vz-primary", "--vz-info", "--vz-warning"]',
        'creative': '["--vz-secondary", "--vz-warning", "--vz-success"]',
        'galaxy': '["--vz-primary", "--vz-primary-rgb, 0.1", "--vz-primary-rgb, 0.50"]',
        'corporate': '["--vz-primary", "--vz-secondary", "--vz-danger"] ',
        'classic': '["--vz-primary", "--vz-secondary", "--vz-warning"]'
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-warning", "--vz-success"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// project crypto
export function status7(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-success", "--vz-primary", "--vz-warning", "--vz-danger"]',
        'minimal': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.70", "--vz-primary-rgb, 0.50"]',
        'galaxy': '["--vz-primary", "--vz-primary-rgb, 0.85", "--vz-primary-rgb, 0.70", "--vz-primary-rgb, 0.50"]'
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-warning", "--vz-success"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// project crypto
export function marketplaceChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-primary","--vz-success", "--vz-light"]',
        'corporate': '["--vz-primary","--vz-secondary", "--vz-light"]',
        'galaxy': '["--vz-primary","--vz-success", "--vz-secondary"]',
        'classic': '["--vz-primary","--vz-light", "--vz-secondary"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-warning", "--vz-success"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

export function popularityChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-success", "--vz-warning"]',
        'minimal': '["--vz-gray-200", "--vz-primary"]',
        'corporate': '["--vz-success", "--vz-secondary"]',
        'galaxy': '["--vz-primary-rgb, 0.65", "--vz-primary"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-primary", "--vz-warning", "--vz-success"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// job dashboard
export function dashedLineChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-success", "--vz-info", "--vz-primary"]',
        'modern': '["--vz-primary", "--vz-secondary", "--vz-success"]',
        'interactive': '["--vz-secondary", "--vz-info", "--vz-primary"]',
        'creative': '["--vz-info", "--vz-secondary", "--vz-success"]',
        'corporate': '["--vz-secondary", "--vz-success", "--vz-primary"]',
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-success", "--vz-info", "--vz-primary"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// job page
export function DealTypeCharts(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-info", "--vz-secondary"]',
        'modern': '["--vz-info", "--vz-secondary"]'
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-info", "--vz-secondary"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};

// echart
export function StackedLineChart(theme: any) {
    const themeColorMap: any = {
        'default': '["--vz-info", "--vz-secondary"]',
        'modern': '["--vz-info", "--vz-secondary"]'
    };
    // Set chart colors based on the theme value
    const chartColors = themeColorMap[theme] || '["--vz-info", "--vz-secondary"]';
    // Call your _analyticsChart function with the updated colors
    return chartColors;
};
