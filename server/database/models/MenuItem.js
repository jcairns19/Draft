import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    abv: {
      type: DataTypes.DECIMAL(5, 2),
    },
    description: {
      type: DataTypes.TEXT,
    },
    image_url: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'menu_items',
    timestamps: false,
  });

  MenuItem.associate = (models) => {
    MenuItem.hasMany(models.TabItem, { foreignKey: 'menu_item_id', onDelete: 'CASCADE' });
    MenuItem.hasMany(models.RestaurantMenuItem, { foreignKey: 'menu_item_id', onDelete: 'CASCADE' });
    MenuItem.belongsToMany(models.Restaurant, {
      through: models.RestaurantMenuItem,
      foreignKey: 'menu_item_id',
      otherKey: 'restaurant_id',
    });
  };

  return MenuItem;
};