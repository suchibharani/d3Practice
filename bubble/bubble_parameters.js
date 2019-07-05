var BUBBLE_PARAMETERS = {
    "data_file": "DonaldTrumpNetWorth2016.csv",
    "map_file": "us.json",
    "report_title": "Donald Trump Net Worth 2016",
    "footer_text": "Net Value of Assets owned by Donald J. Trump.  Source: Jennifer Wang/Forbes.",
    "width": 940,
    "height": 600,
    "force_strength": 0.03,
    "force_type": "charge",
    "radius_field": "Net Value",
    "numeric_fields": ["Asset Value", "Debt", "Net Value", "Change vs 2015", "Stake"],
    "fill_color": {
        "data_field": "Change",
        "color_groups": {
            "Down": "#d84b2a",
            "No Change": "#beccae",
            "Up": "#7aa25c"
        }
    },
    "tooltip": [
        {"title": "Asset", "data_field": "Asset"},
        {"title": "Type", "data_field": "Type"},
        {"title": "Asset Value", "data_field": "Asset Value", "format_string": ",.2r"},
        {"title": "Debt", "data_field": "Debt", "format_string": ",.2r"},
        {"title": "Net Value", "data_field": "Net Value", "format_string": ",.2r"},
        {"title": "Change vs 2015", "data_field": "Change vs 2015", "format_string": ",.2r"}
    ],
    "modes": [
        {
            "button_text": "All Assets",
            "button_id": "all",
            "type": "grid",
            "labels": null,
            "grid_dimensions": {"rows": 1, "columns": 1},
            "data_field": null
        },
        {
            "button_text": "Assets by Type",
            "button_id": "region",
            "type": "grid",
            "labels": ["Office and retail", "Residential and retail", "Hotel, condos and retail", "Affordable housing units", "Personal assets", "Golf resort", "Winery", "Licensing agreements", "Industrial warehouse"],
            "grid_dimensions": {"rows": 3, "columns": 3},
            "data_field": "Type"
        },
        {
            "button_text": "Assets by Change in Value",
            "button_id": "Change",
            "type": "grid",
            "labels": ["Down", "No Change", "Up"],
            "grid_dimensions": {"rows": 1, "columns": 3},
            "data_field": "Change"
        },
        {
            "button_text": "Change in value vs Net Value",
            "button_id": "change_vs_net_value",
            "type": "scatterplot",
            "x_data_field": "Net Value",
            "y_data_field": "Change vs 2015",
            "x_format_string": ",.2r",
            "y_format_string": ",.2r"
        },
        {
            "button_text": "Assets by Location",
            "button_id": "assets_on_map",
            "type": "map",
            "latitude_field": "Latitude",
            "longitude_field": "Longitude"
        }
    ]
};