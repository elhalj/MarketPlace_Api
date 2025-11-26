// import { Restaurant } from "../../domain/Restaurant";
import { IRestaurantRepository } from "../../domain/repositories/IRestaurantRepository";

export class DeleteRestaurant {
    constructor(private readonly restaurantRepository: IRestaurantRepository) {}

    async execute(restaurantId: string): Promise<void> {
        // Check if restaurant exists
        const existingRestaurant = await this.restaurantRepository.findById(restaurantId);
        
        if (!existingRestaurant) {
            throw new Error("Restaurant not found");
        }

        // Delete the restaurant
        await this.restaurantRepository.delete(restaurantId);
    }
}