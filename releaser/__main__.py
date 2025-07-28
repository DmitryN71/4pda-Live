import sys
from .rlsr import ProdReleaser, BetaReleaser


if __name__ == "__main__":
    if sys.version_info.major != 3:
        print("Please use Python 3")
        exit()

    releasers = (ProdReleaser, BetaReleaser)

    print("Hello! Let's create manifest.json file. ")
    for i, item in enumerate(releasers):
        print(f"{i}. {item.NAME}")

    try:
        choice = int(input("Enter the number of your choice: "))
        releaser = releasers[choice]()
    except (IndexError, ValueError):
        print('Invalid choice')
        exit()
    except AssertionError as e:
        print(e)
        exit()
    except KeyboardInterrupt:
        exit()

    releaser.save_manifest()
    releaser.zip_files()
