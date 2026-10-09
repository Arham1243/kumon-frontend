import { PureAbility } from '@casl/ability';

export const ability = new PureAbility();

export function updateAbility(permissions) {
    const rules = permissions.map((permission) => {
        return { action: permission };
    });

    ability.update(rules);
}
