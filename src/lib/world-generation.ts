/** @format */

// https://scijinks.gov/review/climate-zones/climate-zones2.jpg

export const CLIMATE_REGIONS = [
    "tropical",
    "dry",
    "temperate",
    "continental",
    "polar",
];

// https://www.exploringnature.org/graphics/ecology/biome_pyramid_poster72.jpg
// https://upload.wikimedia.org/wikipedia/commons/e/e4/Vegetation.png
// https://images.my.labster.com/v2/CCB/86ed9864-ad3d-4173-9214-87bba5962076/CCB_BiomesPerLatitude.en.x512.png

export const BIOME_SPECTRUM = {
    axes: {
        moisture: {
            axis: "horizontal",
            // 0 = dry, 1 = wet
            range: ["dry", "wet"],
        },
        temperature: {
            axis: "vertical",
            // 0 = cold, 1 = hot
            range: ["cold", "hot"],
        },
    },
};

// https://scontent-icn2-1.xx.fbcdn.net/v/t39.30808-6/485118577_1066114632228344_5956189264747119216_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=P8a3JXCclRoQ7kNvwFHoQQA&_nc_oc=AdlUiIISnMhem0u9eA6zHZb7_w3uPU8IEj1lzvI9H8oCKQJVfG6gwgL2UA2Rqp16USA&_nc_zt=23&_nc_ht=scontent-icn2-1.xx&_nc_gid=Wkplr0Wdqh-ftkF4YkPzcQ&oh=00_AfTctVN1eWzBi96PzTEWcieUqdEeGL61dmGuxTDGTsxH8g&oe=688CE281
export const BIOMES = {
    rainforest: {
        moisture: 1.0,
        temperature: 1.0,
        climate: "tropical",
    },
    "tropical seasonal forest": {
        moisture: 0.8,
        temperature: 1.0,
        climate: "tropical",
    },
    scrubland: {
        moisture: 0.6,
        temperature: 1.0,
        climate: "tropical",
    },
    savanna: {
        moisture: 0.4,
        temperature: 1.0,
        climate: "tropical",
    },
    "tropical desert": {
        moisture: 0.0,
        temperature: 1.0,
        climate: "tropical",
    },

    "deciduous forest": {
        moisture: 0.8,
        temperature: 0.5,
        climate: "temperate",
    },
    chaparral: {
        moisture: 0.6,
        temperature: 0.5,
        climate: "temperate",
    },
    grassland: {
        moisture: 0.4,
        temperature: 0.5,
        climate: "temperate",
    },
    "temperate desert": {
        moisture: 0.1,
        temperature: 0.5,
        climate: "temperate",
    },
    "coniferous forest": {
        moisture: 0.5,
        temperature: 0.25,
        climate: "subpolar",
    },
    tundra: {
        moisture: 0.5,
        temperature: 0.0,
        climate: "polar",
    },
};

// Aquatic Biomes:
export const AQUATIC_BIOMES = {
    aquaticBiomes: [
        {
            name: "Ponds & Lakes",
            category: "Freshwater",
            saltConcentration: "<1%",
            waterMovement: "Still/Stationary",
            characteristics: [
                "Shallow waters with abundant fish and algae",
                "Deep waters where decomposers thrive",
            ],
        },
        {
            name: "Rivers & Streams",
            category: "Freshwater",
            saltConcentration: "<1%",
            waterMovement: "Flowing",
            characteristics: [
                "Headwaters: clear water with high oxygen levels",
                "Downstream: turbid water with variable oxygen levels",
            ],
        },
        {
            name: "Estuaries",
            category: "Marine",
            saltConcentration: "Brackish (mix of fresh and salt)",
            waterMovement: "Mixing",
            characteristics: [
                "Home to fish, shellfish, and migratory birds",
                "Organisms adapted to changing salinity",
            ],
        },
        {
            name: "Oceans & Seas",
            category: "Marine",
            saltConcentration: "~3.5%",
            waterMovement: "Currents",
            characteristics: [
                "Photic zone: coral reefs with diverse species",
                "Aphotic zone: chemosynthetic bacteria–based food chains",
            ],
        },
    ],
};
