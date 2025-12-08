import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TabItem = sequelize.define('TabItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tab_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tabs',
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    sub_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    served: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'tab_items',
    timestamps: false, // No updated_at
    indexes: [
      {
        fields: ['tab_id'],
      },
    ],
  });

  TabItem.associate = (models) => {
    TabItem.belongsTo(models.Tab, { foreignKey: 'tab_id' });
    TabItem.belongsTo(models.MenuItem, { foreignKey: 'menu_item_id' });
  };

  return TabItem;
};