const { DataTypes, Model, Sequelize, Op } = require('sequelize');
const sequelize = require('./../database');
const { logger } = require('./../logger');

module.exports.BonesSpec = class BonesSpec extends Model {
    static {
        BonesSpec.init(
            {
                ID: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    allowNull: false,
                    primaryKey: true,
                    unique: true,
                },
                Level: {
                    type: DataTypes.INTEGER,
                    autoIncrement: false,
                    allowNull: false,
                },
                ZoneID: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                },
                ZoneZ: {
                    type: DataTypes.INTEGER,
                    autoIncrement: false,
                    allowNull: false,
                },
                ZoneTier: {
                    type: DataTypes.INTEGER,
                    autoIncrement: false,
                    allowNull: false,
                },
                ZoneTerrainType: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                },
                RegionTier: {
                    type: DataTypes.INTEGER,
                    autoIncrement: false,
                    allowNull: false,
                },
                TerrainTravelClass: {
                    type: DataTypes.TEXT,
                    autoIncrement: false,
                    allowNull: false,
                },
            },
            {
                scopes: {
                    ofBones(BonesID) {
                        return {
                            where: {
                                BonesID: { [Op.is]: BonesID },
                            },
                        };
                    },
                },
                sequelize: sequelize,
                modelName: 'BonesSpec'
            }
        );
    };

    static wildcard = "*";

    static approxDepth = Object.freeze({
        Wildcard: -1,   // Any
        Sky: 0,         // Strata 0-9
        Surface: 1,     // Stratum 10
        Shallow: 2,     // Strata 11-20
        Deep: 3,        // Strata 21-40
        Abyssal: 4,     // Strata 41-997
        CryoClone: 5,   // Strata 998+
    });

    static approxDepthFromZoneZ(ZoneZ) {
        if (ZoneZ >= 998) {
            return approxDepth.CryoClone;
        } else if (ZoneZ >= 41) {
            return approxDepth.Abyssal;
        } else if (ZoneZ >= 21) {
            return approxDepth.Deep;
        } else if (ZoneZ >= 11) {
            return approxDepth.Shallow;
        } else if (ZoneZ >= 10) {
            return approxDepth.Surface;
        } else if (ZoneZ >= 0) {
            return approxDepth.Sky;
        }
        return approxDepth.Wildcard;
    }
    getApproxDepth() {
        return approxDepthFromZoneZ(this.ZoneZ);
    }

    static approxDepthFromLabel(Label) {
        if (Object.keys(approxDepth).includes(Label)) {
            return approxDepth[Label];
        }
        return approxDepth.Wildcard;
    }

    static getApproxDepthLabel(Value) {
        var labels = Object.keys(approxDepth);
        var index = Object.values(approxDepth).indexOf(Value);
        if (index >= labels.length
            || index < 0)
            return labels[0];
        return labels[index];
    }

    isZoneStrataWithinThreshold(SpecZ) {
        var zoneZ = approxDepthFromZoneZ(this);
        var specZ = approxDepthFromZoneZ(SpecZ);
        return isEitherWildcard(zoneZ, specZ, approxDepth.Wildcard)
            || zoneZ === specZ
            ;
    }

    static isEitherWildcard(X, Y, Wildcard) {
        return X === Wildcard
            || Y === Wildcard
            ;
    }

    static isWithinLevel(Level, SpecLevel) {
        if ((Level / Math.max(1.0, SpecLevel)) < 0.85) {
            return false;
        }

        if ((SpecLevel / Math.max(1.0, Level)) < 0.85) {
            return false;
        }

        return true;
    }

    static isValid(Spec) {
        if (!Spec) {
            return false;
        }
        if (!Spec.Level) {
            return false;
        }
        if (!Spec.ZoneID) {
            return false;
        }
        if (!Spec.ZoneZ) {
            return false;
        }
        if (!Spec.ZoneTier) {
            return false;
        }
        if (!Spec.ZoneTerrainType) {
            return false;
        }
        if (!Spec.RegionTier) {
            return false;
        }
        if (!Spec.TerrainTravelClass) {
            return false;
        }
        return true;
    }
    isValid() {
        return isValid(this);
    }

    static isEqual(Spec, Other) {
        if (!Spec || !Other)
            return !Spec == !Other;

        if (Spec == Other)
            return true;

        return BonesID == Other.BonesID
            && Spec.Level != 0
            && Spec.Level == Other.Level
            && Spec.ZoneID == Other.ZoneID
            && Spec.ZoneZ == Other.ZoneZ
            && Spec.ZoneTier == Other.ZoneTier
            && Spec.ZoneTerrainType == Other.ZoneTerrainType
            && Spec.RegionTier == Other.RegionTier
            && Spec.TerrainTravelClass == Other.TerrainTravelClass
            ;
    }
    sameAs(Other) {
        return isEqual(this, Other)
    }

    isWithinSpec(PlayerSpec) {
        if (!this.isValid()) {
            logger.warn(new Error('Passed invalid BonesSpec'));
            return false;
        }

        if (!isValid(PlayerSpec)) {
            logger.warn(new Error('Passed invalid PlayerSpec'));
            return false;
        }

        if (this.sameAs(PlayerSpec)) {
            return true;
        }

        if (!isEitherWildcard(this.Level, PlayerSpec.Level, -1)
            && !isWithinLevel(this.Level, PlayerSpec.Level)) {
            return false;
        }

        if (!isZoneStrataWithinThreshold(this.ZoneZ, PlayerSpec.ZoneZ)) {
            return false;
        }

        if (!isEitherWildcard(this.ZoneTier, PlayerSpec.ZoneTier, -1)
            && Math.Abs(ZoneTier - PlayerSpec.ZoneTier) > 5) {
            return false;
        }

        if (!isEitherWildcard(this.ZoneTerrainType, PlayerSpec.ZoneTerrainType, wildcard)
            && this.ZoneTerrainType != PlayerSpec.ZoneTerrainType) {
            return false;
        }

        if (!isEitherWildcard(this.RegionTier, PlayerSpec.RegionTier, -1)
            && this.RegionTier != PlayerSpec.RegionTier) {
            return false;
        }

        if (!isEitherWildcard(this.TerrainTravelClass, PlayerSpec.TerrainTravelClass, wildcard)
            && !isEitherWildcard(this.TerrainTravelClass, PlayerSpec.TerrainTravelClass, '')
            && !isEitherWildcard(this.TerrainTravelClass, PlayerSpec.TerrainTravelClass, null)
            && this.TerrainTravelClass != PlayerSpec.TerrainTravelClass) {
            return false;
        }

        return true;
    }
    /*isNaughty() {
        return this.getUser()
            && this.getUser().Naughty;
    }*/
}