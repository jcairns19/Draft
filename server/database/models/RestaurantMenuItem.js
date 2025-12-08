import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const RestaurantMenuItem = sequelize.define('RestaurantMenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    menu_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menu_items',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'restaurant_menu_items',
    timestamps: false, // No updated_at
    indexes: [
      {
        fields: ['restaurant_id'],
      },
      {
        fields: ['menu_item_id'],
      },
      {
        fields: ['restaurant_id', 'menu_item_id'],
        unique: true,
      },
    ],
  });

  RestaurantMenuItem.associate = (models) => {
    RestaurantMenuItem.belongsTo(models.Restaurant, { foreignKey: 'restaurant_id' });
    RestaurantMenuItem.belongsTo(models.MenuItem, { foreignKey: 'menu_item_id' });
  };

  return RestaurantMenuItem;
};